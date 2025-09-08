from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
from sqlalchemy.orm import Session
import logging
import os

from get_emails_info import get_emails_info_for_user, get_html_from_message_id
from get_coupon_info_from_email import get_coupon_info_from_email
from get_company_logo import get_company_logo_info
from company_categorization import get_company_category
from googleapiclient.discovery import build
from google.oauth2.credentials import Credentials

# Import authentication
from auth.routes import router as auth_router, get_current_user
from auth.schemas import UserResponse
from auth.crud import get_user_by_id
from database.connection import Base, engine, get_db

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Create database tables
Base.metadata.create_all(bind=engine)

# Create FastAPI app
app = FastAPI(
    title="Deal Detector API",
    description="Extract and analyze coupon information from promotional emails with user authentication",
    version="2.0.0"
)

# Add CORS middleware for frontend access
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify your frontend domain
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include authentication routes
app.include_router(auth_router, tags=["authentication"])

def create_gmail_service_for_user(user: UserResponse):
    """Create a Gmail service using the user's stored tokens"""
    if not user.gmail_access_token:
        raise HTTPException(status_code=400, detail="No Gmail access token found")
    
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
    
    return build('gmail', 'v1', credentials=user_creds)

class CouponResponse(BaseModel):
    all_coupons: List[dict] = []
    total_emails_processed: int = 0
    emails_with_coupons: int = 0

class EmailHtmlResponse(BaseModel):
    success: bool
    message_id: str
    html_content: str
    error: Optional[str] = None

@app.get("/api/coupons", response_model=CouponResponse)
async def get_coupons(
    current_user: UserResponse = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Extract coupon information from promotional emails for the authenticated user.
    
    This endpoint:
    1. Fetches emails from the USER'S Gmail account (not static files!)
    2. Extracts text content (including OCR from images) for each email
    3. Analyzes each email for coupon/promotional offers using AI
    4. Returns a list of all coupons found
    """
    try:
        logger.info(f"Starting email processing for user: {current_user.email}")
        
        # Check if user has Gmail connected
        user = get_user_by_id(db, current_user.id)
        if not user or not user.gmail_connected or not user.gmail_access_token:
            raise HTTPException(
                status_code=400, 
                detail="Gmail not connected. Please connect your Gmail account first."
            )
        
        # Create Gmail service using USER'S tokens (not static files!)
        gmail_service = create_gmail_service_for_user(current_user)
        logger.info(f"Created Gmail service for user {current_user.email}")
        
        # Get email texts using USER'S Gmail service
        emails_info = get_emails_info_for_user(gmail_service)
        
        if not emails_info:
            raise HTTPException(
                status_code=404,
                detail="No email content found"
            )
        
        logger.info(f"Processing {len(emails_info)} emails for user {current_user.email}")
        
        # Process each email (same as main.py)
        all_coupons = []
        for i, id in enumerate(emails_info):
            logger.info(f"Processing email {i+1}/{len(emails_info)}")
            
            email_text = emails_info[id]["email_text"]
            email_timestamp = emails_info[id]["email_timestamp"]
            email_subject = emails_info[id]["email_subject"]
            email_sender = emails_info[id]["email_sender"]

            if not email_text or not email_text.strip():
                continue
                
            coupons_json = get_coupon_info_from_email(email_text, email_subject, email_sender, email_timestamp)
            
            if "error" in coupons_json:
                logger.warning(f"Error processing email {i+1}: {coupons_json['error']}")
                continue
                
            if coupons_json.get("has_coupon", False):
                # Get company logo and domain info
                logo_info = get_company_logo_info(email_sender)
                
                # Get company category based on domain
                company_domain = logo_info.get("domain")
                if company_domain:
                    company_category = get_company_category(company_domain)
                else:
                    # Fallback: extract domain from email sender
                    if '@' in email_sender:
                        sender_domain = email_sender.split('@')[-1].split('>')[0]
                        company_category = get_company_category(sender_domain)
                    else:
                        company_category = 'general'
                
                # Add unique IDs to each offer
                if "offers" in coupons_json:
                    for i, offer in enumerate(coupons_json["offers"]):
                        # Generate unique ID using message_id + offer index (guaranteed unique)
                        unique_id = f"{id}_{i}"
                        offer["id"] = unique_id
                
                # Insert timestamp, subject, sender, and message_id in dict
                coupons_json = {"timestamp": email_timestamp, **coupons_json}
                coupons_json = {"subject": email_subject, **coupons_json}
                coupons_json = {"sender": email_sender, **coupons_json}
                coupons_json = {"message_id": id, **coupons_json}
                coupons_json = {"company_domain": company_domain, **coupons_json}
                coupons_json = {"company_logo_url": logo_info.get("logo_url"), **coupons_json}
                coupons_json = {"company_category": company_category, **coupons_json}

                # has_coupon will always be True, no need to include in backend JSON
                coupons_json.pop("has_coupon", None) 
                
                all_coupons.append(coupons_json)
                
                logger.info(f"Found coupons in email {i+1}")
        
        logger.info(f"Total coupons found: {len(all_coupons)} out of {len(emails_info)} emails for user {current_user.email}")
        
        return CouponResponse(
            all_coupons=all_coupons,
            total_num_coupons=len(all_coupons),
            total_emails_processed=len(emails_info),
            emails_with_coupons=len(all_coupons)
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Unexpected error for user {current_user.email}: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Internal server error: {str(e)}"
        )

@app.get("/api/email_html/{message_id}", response_model=EmailHtmlResponse)
async def get_email_html(
    message_id: str,
    current_user: UserResponse = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get HTML content from a specific Gmail message by message ID for the authenticated user.
    """
    try:
        logger.info(f"Fetching HTML content for message ID: {message_id} for user: {current_user.email}")
        
        # Check if user has Gmail connected
        user = get_user_by_id(db, current_user.id)
        if not user or not user.gmail_connected or not user.gmail_access_token:
            raise HTTPException(
                status_code=400, 
                detail="Gmail not connected. Please connect your Gmail account first."
            )
        
        # Create Gmail service using USER'S tokens
        gmail_service = create_gmail_service_for_user(current_user)
        
        # Get HTML content using the existing function
        html_content = get_html_from_message_id(gmail_service, message_id)
        
        if not html_content:
            raise HTTPException(
                status_code=404,
                detail=f"No HTML content found for message ID: {message_id}"
            )
        
        logger.info(f"Successfully retrieved HTML content for message ID: {message_id}")
        
        return EmailHtmlResponse(
            success=True,
            message_id=message_id,
            html_content=html_content
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching HTML for message {message_id}: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch email HTML: {str(e)}"
        )

@app.get("/api/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "message": "Coupon Filtering API is running"
    }

@app.get("/api/debug")
async def debug_info():
    """Debug endpoint to check what routes are loaded"""
    routes = []
    for route in app.routes:
        if hasattr(route, 'path') and hasattr(route, 'methods'):
            routes.append({
                "path": route.path,
                "methods": list(route.methods) if route.methods else []
            })
    return {
        "total_routes": len(routes),
        "routes": routes[:10],  # First 10 routes
        "auth_routes_loaded": any("/auth" in route["path"] for route in routes)
    }

@app.get("/api/debug/database")
async def debug_database():
    """Debug endpoint to check database configuration and tables"""
    try:
        from database.connection import engine
        from sqlalchemy import inspect
        
        inspector = inspect(engine)
        tables = inspector.get_table_names()
        
        # Also check the database URL
        db_url = str(engine.url)
        
        return {
            "database_url": db_url,
            "tables_found": tables,
            "total_tables": len(tables)
        }
    except Exception as e:
        return {
            "error": str(e),
            "database_url": None,
            "tables_found": [],
            "total_tables": 0
        }

@app.post("/api/debug/create-test-user")
async def create_test_user(db: Session = Depends(get_db)):
    """Create a test user to verify database writes work"""
    try:
        from auth.models import User
        from auth.schemas import GoogleUserInfo
        from auth.crud import create_user_from_google
        
        # Create a test Google user
        test_google_user = GoogleUserInfo(
            id="test_google_id_123",
            email="test@example.com",
            given_name="Test",
            family_name="User",
            picture=None
        )
        
        # Try to create the user
        user = create_user_from_google(db, test_google_user)
        
        return {
            "success": True,
            "user_id": user.id,
            "email": user.email,
            "message": "Test user created successfully"
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "message": "Failed to create test user"
        }

@app.get("/api/debug/env")
async def debug_env():
    """Debug endpoint to check environment variables"""
    import os
    from core.config import settings
    
    return {
        "database_url_from_settings": settings.database_url,
        "database_url_from_env": os.getenv("DATABASE_URL", "NOT_SET"),
        "database_public_url_from_env": os.getenv("DATABASE_PUBLIC_URL", "NOT_SET"),
        "env_keys": [k for k in os.environ.keys() if "DATABASE" in k.upper()]
    }

@app.get("/api/debug/test-simple-auth")
async def test_simple_auth(db: Session = Depends(get_db)):
    """Test simple database lookup without complex auth"""
    try:
        from auth.models import User
        from auth.crud import get_user_by_id
        
        # Try to get user ID 1 directly
        user = get_user_by_id(db, 1)
        
        if user:
            return {
                "success": True,
                "user_found": True,
                "user_id": user.id,
                "user_email": user.email,
                "gmail_connected": user.gmail_connected,
                "user_attrs": dir(user)[:10]  # First 10 attributes for debugging
            }
        else:
            return {
                "success": True,
                "user_found": False,
                "message": "User ID 1 not found"
            }
    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "error_type": type(e).__name__
        }

@app.get("/api/debug/generate-token")
async def generate_test_token():
    """Generate a valid JWT token for local testing"""
    from core.security import create_access_token
    
    # Create token for user ID 1 (test user we created)
    access_token = create_access_token(
        data={"sub": "1", "email": "test@example.com"}
    )
    
    return {
        "access_token": access_token,
        "instructions": "Use this token for local testing"
    }

@app.get("/api/test-auth")
async def test_auth(current_user: UserResponse = Depends(get_current_user)):
    """Test endpoint to verify authentication works"""
    return {
        "message": "Authentication working!",
        "user_email": current_user.email,
        "gmail_connected": current_user.gmail_connected,
        "has_gmail_tokens": bool(current_user.gmail_access_token)
    }

if __name__ == "__main__":
    import uvicorn
    import os
    
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run(
        "api:app", 
        host="0.0.0.0", 
        port=port, 
        reload=True,
        log_level="info"
    )
