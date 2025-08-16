import os
import json
import google.generativeai as genai
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

def get_coupon_info_from_email(email_text, email_subject, email_sender):
    """
    Extracts comprehensive coupon information from email text using Gemini AI.
    """
    # Configure Gemini API
    genai.configure(api_key=os.getenv("GEMINI_API_KEY"))
    
    try:
        # Get the model
        model = genai.GenerativeModel('gemini-2.5-flash-lite')
        
        # Focused prompt for coupon extraction
        prompt = f"""
        Extract actionable coupon offers from this email. ONLY classify as coupon if it provides immediate monetary savings.

        Email: {email_sender} | {email_subject}
        Content: {email_text}

        STRICT CRITERIA FOR offer_type - Must have ALL required fields:
        • discount: Specific % or $ off + shopping method (e.g., "20% off", "Shop Now")
        • coupon: Promotional code (e.g., "SAVE20", "Use Code")  
        • free_shipping: Free delivery terms (e.g., "Free shipping on $50+")
        • bogo: Buy one get one + purchase method (e.g., "BOGO shoes", "Shop Now")
        • free_gift: Free item with purchase (e.g., "Free sample with $25 order")
        • loyalty_points: Specific points/cashback value (e.g., "5% cashback", "100 points")

        ONLY ACCEPT if email offers immediate monetary savings:
        - Specific discounts with clear amounts or percentages
        - Promotional codes for discounts
        - Free shipping with clear terms
        - Buy-one-get-one deals with purchase requirement
        - Free items contingent on purchase
        - Reward points/cashback with specific percentages or values

        EXPIRY DATE RULES:
        - Explicit dates: extract exact date (YYYY-MM-DD)
        - Infer from keywords: "Daily Deal"→today, "Weekly Sale"→end of week, "Flash Sale"→2 days, "Weekend Special"→Sunday
        - Mark inferred dates clearly for UI display

        JSON Response Structure:
        {{"has_coupon": true/false, "email_sender_company": "Company Name", "offers": [...]}}

        Each offer object must include:
        {{
            "offer_brand": "specific brand name, may be same as sender",
            "offer_type": "discount|coupon|free_shipping|bogo|free_gift|loyalty_points", 
            "discount_amount": "20%|$10|null",
            "coupon_code": "CODE123|null",
            "expiry_date": "2025-08-20|null",
            "expiry_inferred": true/false,
            "offer_title": "concise title",
            "offer_description": "brief description", 
            "minimum_purchase": "$50|null",
            "terms_conditions": "key restrictions|null",
            "call_to_action": "Shop Now|Use Code|etc",
            "product_category": "clothing|electronics|all|etc"
        }}
        """
        
        # Generate content
        response = model.generate_content(prompt)
        
        # Parse the JSON response
        try:
            response_text = response.text.strip()
            
            # Check if response is wrapped in markdown code blocks
            if response_text.startswith("```json") and response_text.endswith("```"):
                # Extract JSON from markdown code blocks
                json_text = response_text[7:-3].strip()  # Remove ```json and ```
            elif response_text.startswith("```") and response_text.endswith("```"):
                # Generic code block
                json_text = response_text[3:-3].strip()  # Remove ``` and ```
            else:
                # Plain JSON
                json_text = response_text

            coupon_info = json.loads(json_text)
            return coupon_info
        except json.JSONDecodeError as e:
            # If JSON parsing fails, try to extract structured info manually
            print(f"Failed to parse JSON response. JSON Error: {e}")
            print("Raw response:")
            print(response.text)
            return {"has_coupon": False, "error": "Failed to parse AI response"}
            
    except Exception as e:
        print(f"Error processing email with Gemini: {e}")
        return {"has_coupon": False, "error": str(e)}