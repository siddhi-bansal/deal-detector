# Test specific email with improved coupon classification

import os
import json
from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError
from dotenv import load_dotenv

from get_emails_info import get_email_text_and_html, get_img_links_from_html, get_text_from_images, preprocess_plain_text, get_email_sender, get_email_subject, get_email_timestamp
from get_coupon_info_from_email import get_coupon_info_from_email

# Load environment variables
load_dotenv()

# Gmail API scopes
SCOPES = ["https://www.googleapis.com/auth/gmail.readonly"]

def get_gmail_service():
    """Get authenticated Gmail service"""
    creds = None
    if os.path.exists("token.json"):
        creds = Credentials.from_authorized_user_file("token.json", SCOPES)
    
    if not creds or not creds.valid:
        if creds and creds.expired and creds.refresh_token:
            creds.refresh(Request())
        else:
            flow = InstalledAppFlow.from_client_secrets_file("credentials.json", SCOPES)
            creds = flow.run_local_server(port=0)
        with open("token.json", "w") as token:
            token.write(creds.to_json())
    
    return build("gmail", "v1", credentials=creds)

def test_specific_email(message_id):
    """Test coupon classification on a specific email"""
    print(f"Testing email with ID: {message_id}")
    
    # Get Gmail service
    service = get_gmail_service()
    
    try:
        # Fetch the specific email
        message_object = service.users().messages().get(userId="me", id=message_id).execute()
        
        # Extract email components
        plain_text, html_text = get_email_text_and_html(message_object)
        plain_text = preprocess_plain_text(plain_text)

        # Extract img src links
        img_links = get_img_links_from_html(html_text)

        img_text = ""
        # Get text from images using OCR
        if img_links:
            img_text = get_text_from_images(img_links)
            # Append the image text to the plain text
            plain_text += "\n" + img_text

        all_text = "Plain Text: " + plain_text.strip() + "\n Image Text:" + img_text.strip()
        
        email_sender = get_email_sender(message_object)
        email_subject = get_email_subject(message_object)
        email_timestamp = get_email_timestamp(message_object)
        
        print(f"\n=== EMAIL DETAILS ===")
        print(f"Sender: {email_sender}")
        print(f"Subject: {email_subject}")
        print(f"Timestamp: {email_timestamp}")
        print(f"Content preview: {all_text[:200]}...")
        
        # Test coupon classification
        print(f"\n=== TESTING COUPON CLASSIFICATION ===")
        coupon_result = get_coupon_info_from_email(all_text, email_subject, email_sender)
        
        # Display results
        print(f"Has Coupon: {coupon_result.get('has_coupon', False)}")
        
        if coupon_result.get('has_coupon'):
            print(f"Company: {coupon_result.get('email_sender_company')}")
            print(f"Number of offers: {len(coupon_result.get('offers', []))}")
            
            for i, offer in enumerate(coupon_result.get('offers', []), 1):
                print(f"\n--- Offer {i} ---")
                print(f"Type: {offer.get('offer_type')}")
                print(f"Brand: {offer.get('offer_brand')}")
                print(f"Title: {offer.get('offer_title')}")
                print(f"Discount: {offer.get('discount_amount')}")
                print(f"Code: {offer.get('coupon_code')}")
                print(f"Expiry: {offer.get('expiry_date')} (inferred: {offer.get('expiry_inferred', 'N/A')})")
        else:
            print("✅ Email correctly classified as NOT a coupon")
        
        # Save full result to file
        with open(f"test_result_{message_id}.json", "w") as f:
            json.dump({
                "message_id": message_id,
                "email_sender": email_sender,
                "email_subject": email_subject,
                "email_timestamp": str(email_timestamp),  # Convert datetime to string
                "classification_result": coupon_result,
                "email_content_preview": all_text[:500]
            }, f, indent=2)
        
        print(f"\n✅ Full test result saved to test_result_{message_id}.json")
        
    except Exception as e:
        print(f"❌ Error testing email: {e}")
        return None

if __name__ == "__main__":
    # Test the problematic Velvet Taco email (should be classified as NOT a coupon)
    velvet_taco_id = "198a43a4471f303b"  # "Meet The Morning Show: a WTF that gives back."
    
    print("🧪 TESTING IMPROVED COUPON CLASSIFICATION")
    print("=" * 50)
    
    test_specific_email(velvet_taco_id)
    
    print("\n" + "=" * 50)
    print("Test complete! Check if the Velvet Taco menu announcement is correctly rejected.")