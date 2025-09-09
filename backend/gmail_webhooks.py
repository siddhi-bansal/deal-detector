"""
Gmail Push Notifications Handler
Receives real-time notifications when new promotional emails arrive
"""
import json
import base64
import logging
from datetime import datetime
from fastapi import APIRouter, Request, HTTPException, Depends
from sqlalchemy.orm import Session
from googleapiclient.discovery import build
from google.oauth2.credentials import Credentials

from database.connection import get_db
from auth.crud import get_user_by_id
from get_coupon_info_from_email import get_coupon_info_from_email
from get_company_logo import get_company_logo_info
from company_categorization import get_company_category
from get_emails_info import get_email_text_and_html, get_img_links_from_html, get_text_from_images, preprocess_plain_text
import os

# Set up logging
logger = logging.getLogger(__name__)

router = APIRouter(prefix="/webhooks", tags=["gmail-webhooks"])

@router.post("/gmail")
async def gmail_push_notification(request: Request, db: Session = Depends(get_db)):
    """
    Handle Gmail push notifications for new promotional emails
    This endpoint is called by Google when new emails arrive
    """
    try:
        # Get the push notification data
        body = await request.body()
        
        # Gmail sends notifications as Pub/Sub messages
        if not body:
            logger.warning("Received empty push notification")
            return {"status": "ok"}
        
        # Parse the Pub/Sub message
        try:
            notification_data = json.loads(body)
            logger.info(f"Received Gmail push notification: {notification_data}")
        except json.JSONDecodeError:
            logger.error("Invalid JSON in push notification")
            return {"status": "error", "message": "Invalid JSON"}
        
        # Extract Pub/Sub message data
        if "message" not in notification_data:
            logger.warning("No message in push notification")
            return {"status": "ok"}
        
        message = notification_data["message"]
        
        # Decode the message data
        if "data" in message:
            try:
                decoded_data = base64.b64decode(message["data"]).decode('utf-8')
                gmail_notification = json.loads(decoded_data)
                logger.info(f"Decoded Gmail notification: {gmail_notification}")
            except Exception as e:
                logger.error(f"Error decoding notification data: {e}")
                return {"status": "error", "message": "Error decoding data"}
        else:
            logger.warning("No data in push notification message")
            return {"status": "ok"}
        
        # Extract email address and history ID
        email_address = gmail_notification.get("emailAddress")
        history_id = gmail_notification.get("historyId")
        
        if not email_address or not history_id:
            logger.warning(f"Missing email address or history ID: {email_address}, {history_id}")
            return {"status": "ok"}
        
        logger.info(f"Processing notification for {email_address}, history ID: {history_id}")
        
        # Find the user by email address
        # Note: You'll need to add a function to get user by email
        user = get_user_by_email(db, email_address)
        if not user:
            logger.warning(f"User not found for email: {email_address}")
            return {"status": "ok"}
        
        if not user.gmail_connected or not user.gmail_access_token:
            logger.warning(f"Gmail not connected for user: {email_address}")
            return {"status": "ok"}
        
        # Process the new emails
        await process_new_promotional_emails(user, history_id, db)
        
        return {"status": "success", "message": "Notification processed"}
        
    except Exception as e:
        logger.error(f"Error processing Gmail push notification: {e}")
        return {"status": "error", "message": str(e)}

async def process_new_promotional_emails(user, history_id: str, db: Session):
    """
    Process new promotional emails for a user based on history ID
    """
    try:
        # Create Gmail service for this user
        user_creds = Credentials(
            token=user.gmail_access_token,
            refresh_token=user.gmail_refresh_token,
            token_uri="https://oauth2.googleapis.com/token",
            client_id=os.getenv("GOOGLE_CLIENT_ID"),
            client_secret=os.getenv("GOOGLE_CLIENT_SECRET"),
            scopes=[
                'https://www.googleapis.com/auth/gmail.readonly',
                'https://www.googleapis.com/auth/gmail.modify'
            ]
        )
        
        gmail_service = build('gmail', 'v1', credentials=user_creds)
        
        # Get history since the last known history ID
        # We need to store the last processed history ID per user
        last_history_id = get_last_processed_history_id(db, user.id)
        
        if last_history_id:
            # Get history of changes since last processed
            history_response = gmail_service.users().history().list(
                userId='me',
                startHistoryId=last_history_id,
                labelId='CATEGORY_PROMOTIONS'  # Only promotional emails!
            ).execute()
            
            history_records = history_response.get('history', [])
            
            for record in history_records:
                # Look for new messages added to CATEGORY_PROMOTIONS
                messages_added = record.get('messagesAdded', [])
                
                for message_added in messages_added:
                    message_labels = message_added.get('message', {}).get('labelIds', [])
                    
                    # Only process if it's in CATEGORY_PROMOTIONS
                    if 'CATEGORY_PROMOTIONS' in message_labels:
                        message_id = message_added.get('message', {}).get('id')
                        if message_id:
                            logger.info(f"Processing new promotional email: {message_id}")
                            await process_single_email(gmail_service, message_id, user, db)
        
        # Update the last processed history ID
        update_last_processed_history_id(db, user.id, history_id)
        
    except Exception as e:
        logger.error(f"Error processing new promotional emails for user {user.email}: {e}")

async def process_single_email(gmail_service, message_id: str, user, db: Session):
    """
    Process a single new promotional email
    """
    try:
        # Get the full message
        message_object = gmail_service.users().messages().get(
            userId="me", 
            id=message_id
        ).execute()
        
        # Extract email content (reusing existing functions)
        plain_text, html_text = get_email_text_and_html(message_object)
        plain_text = preprocess_plain_text(plain_text)
        
        # Extract images and OCR
        img_links = get_img_links_from_html(html_text)
        img_text = ""
        if img_links:
            img_text = get_text_from_images(img_links)
            plain_text += "\n" + img_text
        
        # Get email metadata
        email_sender = get_email_sender(message_object)
        email_subject = get_email_subject(message_object)
        email_timestamp = get_email_timestamp(message_object)
        
        # Process with AI for coupon detection
        all_text = "Plain Text: " + plain_text.strip() + "\n Image Text:" + img_text.strip()
        coupons_json = get_coupon_info_from_email(all_text, email_subject, email_sender, email_timestamp)
        
        if coupons_json.get("has_coupon", False):
            logger.info(f"Found coupon in new email {message_id} from {email_sender}")
            
            # Get company info
            logo_info = get_company_logo_info(email_sender)
            company_domain = logo_info.get("domain")
            company_category = get_company_category(company_domain) if company_domain else 'general'
            
            # Store the coupon data (you'll need to implement this)
            coupon_data = {
                "message_id": message_id,
                "sender": email_sender,
                "subject": email_subject,
                "timestamp": email_timestamp,
                "company_domain": company_domain,
                "company_logo_url": logo_info.get("logo_url"),
                "company_category": company_category,
                **coupons_json
            }
            
            # Store in database and/or send push notification to user's device
            await store_new_coupon(db, user.id, coupon_data)
            await send_push_notification_to_user(user, coupon_data)
            
    except Exception as e:
        logger.error(f"Error processing single email {message_id}: {e}")

# Helper functions (you'll need to implement these)
def get_user_by_email(db: Session, email: str):
    """Get user by email address"""
    from auth.models import User
    return db.query(User).filter(User.email == email).first()

def get_last_processed_history_id(db: Session, user_id: int) -> str:
    """Get the last processed Gmail history ID for a user"""
    from auth.models import User
    user = db.query(User).filter(User.id == user_id).first()
    return user.gmail_history_id if user else None

def update_last_processed_history_id(db: Session, user_id: int, history_id: str):
    """Update the last processed Gmail history ID for a user"""
    from auth.models import User
    user = db.query(User).filter(User.id == user_id).first()
    if user:
        user.gmail_history_id = history_id
        db.commit()

async def store_new_coupon(db: Session, user_id: int, coupon_data: dict):
    """Store new coupon in database"""
    import json
    from auth.models import UserCoupon
    
    # Create new coupon record
    coupon_record = UserCoupon(
        user_id=user_id,
        email_id=coupon_data.get("message_id", ""),
        coupon_data=json.dumps(coupon_data),
        is_favorite=False
    )
    
    db.add(coupon_record)
    db.commit()
    logger.info(f"Stored new coupon for user {user_id}: {coupon_data.get('sender')}")

async def send_push_notification_to_user(user, coupon_data: dict):
    """Send push notification to user's mobile device"""
    # TODO: Implement this with Expo Push Notifications
    logger.info(f"Would send push notification to {user.email} about new coupon from {coupon_data.get('sender')}")

# Helper functions from get_emails_info.py (you'll need to import or move these)
def get_email_sender(message):
    """Fetch the email sender from the Gmail API."""
    headers = message.get("payload", {}).get("headers", [])
    for header in headers:
        if header.get("name", "").lower() == "from":
            return header.get("value", "")
    return ""

def get_email_subject(message):
    """Fetch the email subject from the Gmail API."""
    headers = message.get("payload", {}).get("headers", [])
    for header in headers:
        if header.get("name", "").lower() == "subject":
            return header.get("value", "")
    return ""

def get_email_timestamp(message):
    """Fetch the email timestamp from the Gmail API."""
    from datetime import datetime
    timestamp_ms = message.get("internalDate")
    if timestamp_ms:
        return datetime.fromtimestamp(int(timestamp_ms) / 1000)
    return ""
