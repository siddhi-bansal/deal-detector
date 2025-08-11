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

        Return a JSON response with this structure:

        For emails WITH offers:
        {{
            "has_coupon": true,
            "offers": [
                {{
                    "company": "company or brand name",
                    "offer_type": "coupon/sale/promotion/free_shipping/BOGO/cashback/loyalty_points",
                    "discount_amount": "percentage or dollar amount (e.g., '20%', '$10', 'Buy 1 Get 1')",
                    "discount_type": "percentage/fixed_amount/BOGO/free_shipping/other",
                    "coupon_code": "promotional code if present",
                    "expiry_date": "expiration date if mentioned, can also be inferred using context",
                    "offer_title": "main headline or title of the offer",
                    "offer_description": "brief description of the promotion",
                    "terms_conditions": "any important restrictions or conditions, like minimum purchase, expiration date, etc.",
                    "call_to_action": "what action the email wants you to take",
                    "additional_benefits": ["free shipping", "free returns", "gift with purchase", etc.],
                    "link": "URL to the offer or product page. if no offer page exists, link to the company's homepage"
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