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
        
        # Comprehensive prompt for coupon extraction
        prompt = f"""
        Analyze this email text and extract ALL coupon/promotional offer information.

        Email Sender: {email_sender}
        Email Subject: {email_subject}
        Email text:
        {email_text}

        OFFER TYPES, REQUIRED FIELDS & CALL-TO-ACTIONS:
        These are the ONLY 6 offer types to use. Each must have required actionable data:

        - discount: Percentage/dollar off (includes flash sales, seasonal sales, clearance)
          Required: discount_amount AND website_url OR clear shopping instructions
          Call-to-action: "Shop Now", "Get Discount", "Save Now", "Shop Sale"

        - coupon: Promotional codes that provide savings
          Required: coupon_code
          Call-to-action: "Use Code", "Apply Code", "Enter Code", "Redeem Code"

        - free_shipping: Shipping cost savings
          Required: minimum_purchase OR coupon_code OR clear terms
          Call-to-action: "Shop Now", "Get Free Shipping", "Order Now", "Free Delivery"

        - bogo: Buy one get one deals
          Required: clear BOGO terms AND website_url OR shopping instructions
          Call-to-action: "Shop BOGO", "Get Deal", "Shop Now", "Buy One Get One"

        - free_gift: Free items with purchase
          Required: specific free item AND purchase requirement
          Call-to-action: "Get Free Gift", "Claim Gift", "Shop Now", "Free Sample"

        - loyalty_points: Points/rewards that convert to savings
          Required: points value OR redemption details OR clear benefit
          Call-to-action: "Earn Points", "Join Rewards", "Sign Up", "Get Points"

        COUPON EMAIL CRITERIA:
        Only classify as "has_coupon": true if the email contains actionable offers with the required fields above.
        Skip pure informational emails, newsletters without offers, account notifications, or announcements without immediate savings.

        EXPIRY DATE INFERENCE RULES:
        - If explicit date mentioned: extract exact date in YYYY-MM-DD format
        - If temporal keywords in subject/content, infer logical expiry:
          * "Daily Deal", "Today Only" → today's date
          * "Weekly Sale", "This Week" → end of current week (Sunday)
          * "Weekend Special", "Weekend Only" → end of weekend (Sunday)
          * "Flash Sale" → 24-48 hours from email timestamp
          * Holiday sales (Valentine's, Black Friday, etc.) → end of holiday/event
          * "Limited Time" without specifics → 7 days from email date
        - Consider email timestamp as reference point for relative dates
        - If no date hints at all, use null

        Return a JSON response with this structure:

        For emails WITH offers:
        {{
            "has_coupon": true,
            "email_sender_company": "actual company sending the email (extracted from sender)",
            "offers": [
                {{
                    "offer_brand": "brand/company this specific offer is for (may be same as sender or different for aggregators)",
                    "offer_type": "Choose MOST SPECIFIC from: discount, coupon, free_shipping, bogo, free_gift, loyalty_points",
                    "discount_amount": "specific amount only (e.g., '20%', '$10', '50% off', 'Free'). For BOGO use 'BOGO', for unclear amounts use null",
                    "coupon_code": "exact promotional code if present, null if none",
                    "expiry_date": "date in YYYY-MM-DD format. If explicitly mentioned, use that date. If not explicit but temporal hints exist, infer logically: 'Weekly Sale' → end of current week, 'Daily Deal' → end of today, 'Weekend Special' → end of weekend, holiday sales → end of holiday, 'Flash Sale' → within 24-48 hours. If no date or temporal hints, use null",
                    "offer_title": "main headline or title of the offer (keep concise)",
                    "offer_description": "brief description of what's being offered and any product/category specifics",
                    "minimum_purchase": "minimum spend requirement if any (e.g., '$50', null if none)",
                    "terms_conditions": "important restrictions only (member-only, first-time customers, etc.)",
                    "call_to_action": "primary action requested (Shop Now, Use Code, Sign Up, etc.)",
                    "product_category": "what type of products this applies to (electronics, clothing, all products, etc.)",
                    "additional_benefits": ["list any extra perks like free shipping, free returns, gift with purchase"]
                }}
            ]
        }}

        For emails WITHOUT offers:
        {{
            "has_coupon": false
        }}

        Be thorough but accurate. Create separate offer objects for each distinct promotion. 
        IMPORTANT: Only classify emails as coupons if they contain actionable offers with required fields.
        Reject purely informational emails, newsletters without specific offers, or vague announcements.
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