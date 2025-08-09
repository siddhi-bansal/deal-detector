from extended_version.backend.get_all_text_from_email import get_text_from_email
from extended_version.backend.get_coupon_info_from_email import get_coupon_info_from_email

def main():
    email_texts = get_text_from_email()
    
    all_coupons = []
    for id in email_texts:
        email_text = email_texts[id]
        # Get coupon info from each email text
        coupons_json = get_coupon_info_from_email(email_text)
        
        # If the email has coupons, append to the list
        if coupons_json.get("has_coupon", False):
            all_coupons.append(coupons_json["offers"])
    
    print(all_coupons)

if __name__ == "__main__":
    main()
