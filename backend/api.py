from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import logging

from get_emails_info import get_emails_info, get_html_from_message_id, run_authorization_server
from get_coupon_info_from_email import get_coupon_info_from_email
from get_company_logo import get_company_logo_info
from company_categorization import get_company_category
from googleapiclient.discovery import build

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Create FastAPI app
app = FastAPI(
    title="Coupon Filtering API",
    description="Extract and analyze coupon information from promotional emails",
    version="1.0.0"
)

# Add CORS middleware for frontend access
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify your frontend domain
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

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
async def get_coupons():
    """
    Extract coupon information from promotional emails.
    
    This endpoint does exactly what main.py does:
    1. Fetches emails from Gmail
    2. Extracts text content (including OCR from images) for each email
    3. Analyzes each email for coupon/promotional offers using AI
    4. Returns a list of all coupons found
    """
    try:
        logger.info("Starting email processing...")
        
        # Get email texts (same as main.py)
        emails_info = get_emails_info()
        
        if not emails_info:
            raise HTTPException(
                status_code=404,
                detail="No email content found"
            )
        
        logger.info(f"Processing {len(emails_info)} emails")
        
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
                
            coupons_json = get_coupon_info_from_email(email_text, email_subject, email_sender)
            
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
        
        logger.info(f"Total coupons found: {len(all_coupons)} out of {len(emails_info)} emails")
        
        # Save response to file immediately
        response_data = {
            "all_coupons": all_coupons,
            "total_num_coupons": len(all_coupons),
            "total_emails_processed": len(emails_info),
            "emails_with_coupons": len(all_coupons)
        }
        
        # Save to file with timestamp
        import datetime
        timestamp = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"api_response_{timestamp}.json"
        
        try:
            import json
            with open(filename, 'w') as f:
                json.dump(response_data, f, indent=2, default=str)
            logger.info(f"Response saved to {filename}")
        except Exception as e:
            logger.warning(f"Failed to save response to file: {e}")
        
        return CouponResponse(
            all_coupons=all_coupons,
            total_num_coupons=len(all_coupons),
            total_emails_processed=len(emails_info),
            emails_with_coupons=len(all_coupons)
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Unexpected error: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Internal server error: {str(e)}"
        )

@app.get("/api/email_html/{message_id}", response_model=EmailHtmlResponse)
async def get_email_html(message_id: str):
    """
    Get HTML content from a specific Gmail message by message ID.
    """
    try:
        logger.info(f"Fetching HTML content for message ID: {message_id}")
        
        # Get Gmail service credentials
        creds = run_authorization_server()
        service = build("gmail", "v1", credentials=creds)
        
        # Get HTML content using the existing function
        html_content = get_html_from_message_id(service, message_id)
        
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

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "api:app", 
        host="0.0.0.0", 
        port=8000, 
        reload=True,
        log_level="info"
    )
