import re
import requests
import logging
from typing import Optional, List

logger = logging.getLogger(__name__)

def extract_root_domain(domain: str) -> str:
    """
    Extract root domain from a subdomain.
    Examples:
    - e.potbelly.com -> potbelly.com
    - mail.amazon.com -> amazon.com
    - noreply.target.com -> target.com
    - starbucks.com -> starbucks.com
    """
    parts = domain.split('.')
    
    # If only 2 parts (domain.com), return as is
    if len(parts) <= 2:
        return domain
    
    # For 3+ parts, take the last 2 (root domain)
    # This handles cases like e.potbelly.com, mail.amazon.com, etc.
    return '.'.join(parts[-2:])

def extract_domain_from_sender(sender_email: str) -> Optional[str]:
    """
    Extract domain from sender email.
    Handles both "Name <email@domain.com>" and "email@domain.com" formats.
    Also normalizes subdomains to root domains (e.g., e.potbelly.com -> potbelly.com).
    """
    try:
        # Extract email from sender (handle both "Name <email>" and "email" formats)
        email_match = re.search(r'<(.+?)>', sender_email)
        if email_match:
            email = email_match.group(1)
        else:
            email = sender_email.strip()
        
        # Extract domain from email
        if '@' not in email:
            return None
        
        full_domain = email.split('@')[1].lower()
        
        # Extract root domain (removes subdomains)
        root_domain = extract_root_domain(full_domain)
        
        return root_domain
    except Exception as e:
        logger.error(f"Error extracting domain from {sender_email}: {str(e)}")
        return None

def get_logo_sources(domain: str) -> List[str]:
    """
    Get list of logo source URLs for a domain.
    """
    return [
        f"https://www.google.com/s2/favicons?domain={domain}&sz=64",
        f"https://logo.clearbit.com/{domain}",
        f"https://img.logo.dev/{domain}?size=64"
    ]

def test_logo_url(url: str, timeout: int = 5) -> bool:
    """
    Test if a logo URL is accessible and returns an image.
    
    Args:
        url: The logo URL to test
        timeout: Request timeout in seconds
        
    Returns:
        True if logo is accessible, False otherwise
    """
    try:
        response = requests.head(url, timeout=timeout)
        return response.status_code == 200
    except requests.RequestException:
        return False

def get_company_logo_from_sender(sender_email: str) -> Optional[str]:
    """
    Get company logo URL from sender email.
    
    This function:
    1. Extracts domain from sender email
    2. Tries multiple logo sources
    3. Tests each source to ensure it works
    4. Returns first working logo URL
    """
    try:
        logger.info(f"Getting logo for sender: {sender_email}")
        
        # Extract domain
        domain = extract_domain_from_sender(sender_email)
        if not domain:
            logger.warning(f"Could not extract domain from: {sender_email}")
            return None
        
        # Get logo sources
        logo_sources = get_logo_sources(domain)
        
        # Test each source to find a working one
        for logo_url in logo_sources:
            if test_logo_url(logo_url):
                logger.info(f"Found working logo for {domain}: {logo_url}")
                return logo_url
        
        logger.warning(f"No working logo found for domain: {domain}. Returning default logo.")
        return "https://cdn-icons-png.flaticon.com/512/295/295144.png" # Default logo

    except Exception as e:
        logger.error(f"Error getting logo for {sender_email}: {str(e)}. Returning default logo.")
        return "https://cdn-icons-png.flaticon.com/512/295/295144.png" # Default logo

def get_company_logo_info(sender_email: str) -> dict:
    """
    Get detailed company logo information from sender email.
    
    Args:
        sender_email: The sender string from email headers
        
    Returns:
        Dictionary with logo info including success status, URL, domain, etc.
    """
    try:
        domain = extract_domain_from_sender(sender_email)
        if not domain:
            return {
                "success": False,
                "company_name": sender_email,
                "domain": None,
                "logo_url": None,
                "error": "Invalid email format"
            }
        
        logo_url = get_company_logo_from_sender(sender_email)
        
        return {
            "success": logo_url is not None,
            "company_name": sender_email,
            "domain": domain,
            "logo_url": logo_url,
            "error": None if logo_url else "No logo sources available"
        }
        
    except Exception as e:
        return {
            "success": False,
            "company_name": sender_email,
            "domain": None,
            "logo_url": None,
            "error": str(e)
        }
