from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import logging

from extended_version.backend.get_all_text_from_email import get_text_from_email
from extended_version.backend.get_coupon_info_from_email import get_coupon_info_from_email

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

# Pydantic models for response
class CouponOffer(BaseModel):
    company: Optional[str] = None
    offer_type: Optional[str] = None
    discount_amount: Optional[str] = None
    discount_type: Optional[str] = None
    coupon_code: Optional[str] = None
    expiry_date: Optional[str] = None
    minimum_purchase: Optional[str] = None
    product_category: Optional[str] = None
    offer_title: Optional[str] = None
    offer_description: Optional[str] = None
    terms_conditions: Optional[str] = None
    urgency_indicators: Optional[List[str]] = None
    call_to_action: Optional[str] = None
    additional_benefits: Optional[List[str]] = None

class CouponResponse(BaseModel):
    all_coupons: List[dict] = []
    total_emails_processed: int = 0
    emails_with_coupons: int = 0

@app.get("/")
async def root():
    """Health check endpoint"""
    return {"message": "Coupon Filtering API is running!"}

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
        email_texts = get_text_from_email()
        
        if not email_texts:
            raise HTTPException(
                status_code=404,
                detail="No email content found"
            )
        
        logger.info(f"Processing {len(email_texts)} emails")
        
        # Process each email (same as main.py)
        all_coupons = []
        for i, id in enumerate(email_texts):
            logger.info(f"Processing email {i+1}/{len(email_texts)}")
            
            email_text = email_texts[id]
            
            if not email_text or not email_text.strip():
                continue
                
            coupons_json = get_coupon_info_from_email(email_text)
            
            if "error" in coupons_json:
                logger.warning(f"Error processing email {i+1}: {coupons_json['error']}")
                continue
                
            if coupons_json.get("has_coupon", False):
                all_coupons.append(coupons_json)
                logger.info(f"Found coupons in email {i+1}")
        
        logger.info(f"Total coupons found: {len(all_coupons)} out of {len(email_texts)} emails")
        
        return CouponResponse(
            all_coupons=all_coupons,
            total_num_coupons=len(all_coupons),
            total_emails_processed=len(email_texts),
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
