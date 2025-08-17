"""
Company categorization module for determining product categories from company domains.
Provides both API-based and local mapping approaches for company categorization.
"""
import os
import requests


def get_company_category_from_clearbit(domain):
    """
    Get company category from Clearbit Enrichment API
    
    Args:
        domain (str): Company domain or email address
        
    Returns:
        str: Simplified product category
    """
    try:
        # Extract domain from email if needed
        if '@' in domain:
            domain = domain.split('@')[1]
        
        # Clearbit Enrichment API
        url = "https://company.clearbit.com/v2/companies/find"
        headers = {
            'Authorization': f"Bearer {os.getenv('CLEARBIT_API_KEY')}"
        }
        params = {
            'domain': domain
        }
        
        response = requests.get(url, headers=headers, params=params, timeout=10)
        
        if response.status_code == 200:
            data = response.json()
            
            # Extract category information
            category = data.get('category', {})
            if category:
                industry = category.get('industry', '')
                sector = category.get('sector', '')
                sub_industry = category.get('subIndustry', '')
                
                # Map to our simplified categories
                return map_clearbit_to_our_categories(industry, sector, sub_industry)
        
        return 'general'
        
    except (requests.RequestException, KeyError, ValueError) as error:
        print(f"Error getting category from Clearbit: {error}")
        return 'general'


def map_clearbit_to_our_categories(industry, sector, sub_industry):
    """
    Map Clearbit's detailed categories to our simplified ones
    
    Args:
        industry (str): Industry from Clearbit
        sector (str): Sector from Clearbit  
        sub_industry (str): Sub-industry from Clearbit
        
    Returns:
        str: Simplified category name
    """
    # Combine all category info for better matching
    category_text = f"{industry} {sector} {sub_industry}".lower()
    
    # Define mappings
    if any(term in category_text for term in ['fashion', 'apparel', 'clothing', 'retail fashion']):
        return 'fashion'
    elif any(term in category_text for term in ['food', 'restaurant', 'dining', 'beverage']):
        return 'food'
    elif any(term in category_text for term in ['technology', 'software', 'saas']):
        return 'technology'
    elif any(term in category_text for term in ['beauty', 'cosmetics', 'skincare']):
        return 'beauty'
    elif any(term in category_text for term in ['home', 'furniture', 'decor']):
        return 'home'
    elif any(term in category_text for term in ['travel', 'hotel', 'airline']):
        return 'travel'
    elif any(term in category_text for term in ['automotive', 'car', 'vehicle']):
        return 'automotive'
    elif any(term in category_text for term in ['health', 'fitness', 'wellness']):
        return 'health'
    elif any(term in category_text for term in ['entertainment', 'media', 'streaming']):
        return 'entertainment'
    elif any(term in category_text for term in ['retail', 'ecommerce', 'shopping']):
        return 'retail'
    else:
        return 'general'


# Simple domain-to-category mapping (free option)
DOMAIN_CATEGORY_MAP = {
    'lulus.com': 'fashion',
    'amazon.com': 'retail',
    'target.com': 'retail',
    'walmart.com': 'retail',
    'nike.com': 'fashion',
    'adidas.com': 'fashion',
    'sephora.com': 'beauty',
    'ulta.com': 'beauty',
    'macys.com': 'fashion',
    'nordstrom.com': 'fashion',
    'starbucks.com': 'food',
    'mcdonalds.com': 'food',
    'dominos.com': 'food',
    'uber.com': 'transportation',
    'lyft.com': 'transportation',
    'airbnb.com': 'travel',
    'booking.com': 'travel',
    'expedia.com': 'travel',
    'spotify.com': 'entertainment',
    'netflix.com': 'entertainment',
    'hulu.com': 'entertainment',
    'bestbuy.com': 'electronics',
    'apple.com': 'technology',
    'microsoft.com': 'technology',
    'google.com': 'technology',
    'wayfair.com': 'home',
    'ikea.com': 'home',
    'homedepot.com': 'home',
    'lowes.com': 'home',
    'cvs.com': 'health',
    'walgreens.com': 'health',
    'gnc.com': 'health',
    'gap.com': 'fashion',
    'oldnavy.com': 'fashion',
    'forever21.com': 'fashion',
    'zara.com': 'fashion',
    'hm.com': 'fashion',
    'uniqlo.com': 'fashion',
    'victorssecret.com': 'fashion',
    'lanebryant.com': 'fashion',
    'torrid.com': 'fashion',
    'kohls.com': 'fashion',
    'jcpenney.com': 'fashion',
    'dillards.com': 'fashion',
    'bloomingdales.com': 'fashion',
    'saksfifthavenue.com': 'fashion',
    'revolve.com': 'fashion',
    'asos.com': 'fashion',
    'shein.com': 'fashion',
    'romwe.com': 'fashion',
    'zaful.com': 'fashion',
    'fashionnova.com': 'fashion',
    'prettylittlething.com': 'fashion',
    'boohoo.com': 'fashion',
    'dollskill.com': 'fashion',
    'urbanbehavior.com': 'fashion',
    'urbanoutfitters.com': 'fashion',
    'anthropologie.com': 'fashion',
    'freepeople.com': 'fashion',
    # Add more as needed
}


def get_category_from_domain_map(domain):
    """
    Simple domain-to-category mapping (fallback method)
    
    Args:
        domain (str): Company domain or email address
        
    Returns:
        str: Product category or 'general' if not found
    """
    if '@' in domain:
        domain = domain.split('@')[1]
    
    return DOMAIN_CATEGORY_MAP.get(domain.lower(), 'general')


def get_company_category(domain, use_api=False):
    """
    Get company category using either API or local mapping
    
    Args:
        domain (str): Company domain or email address
        use_api (bool): Whether to use Clearbit API (requires API key)
        
    Returns:
        str: Product category
    """
    if use_api:
        # Try API first, fallback to local mapping
        category = get_company_category_from_clearbit(domain)
        if category != 'general':
            return category
    
    # Use local domain mapping
    return get_category_from_domain_map(domain)
