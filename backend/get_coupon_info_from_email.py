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

        IMPORTANT INSTRUCTIONS:
        - If the email contains ANY promotional offers, coupons, sales, discounts, or deals, return a JSON with "has_coupon": true and "offers" as a list
        - If the email contains NO promotional offers whatsoever, return: {{"has_coupon": false}}

        OFFER TYPE DEFINITIONS:
        - discount: Percentage or dollar amount off (20% off, $10 off, buy 2 get 15% off)
        - sale: General sales events, seasonal sales, store-wide sales
        - coupon: Specific promotional codes or printable coupons
        - free_shipping: Free shipping, free delivery, free returns
        - bogo: Buy one get one free/half off, buy X get Y free
        - bundle: Multi-item packages, bundle deals, combo offers
        - cashback: Money back, rebates, cash rewards
        - loyalty_points: Points, stars, rewards program benefits, loyalty signups
        - free_gift: Gift with purchase, free samples, free trials, freebies
        - subscription: Discounts on subscriptions, membership pricing, service plans
        - clearance: End of season, last chance, clearance items
        - flash_sale: Time-limited offers, flash sales, limited-time deals
        - new_customer: First-time buyer discounts, welcome offers
        - event: Conference tickets, webinar access, event registration
        - other: Unique offers that don't fit other categories

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
                    "offer_type": "Choose MOST SPECIFIC from: discount, sale, coupon, free_shipping, bogo, bundle, cashback, loyalty_points, free_gift, subscription, clearance, flash_sale, new_customer, event, other",
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

        Be thorough but accurate. Create separate offer objects for each distinct promotion. Only include information that is explicitly stated or clearly implied in the email.
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