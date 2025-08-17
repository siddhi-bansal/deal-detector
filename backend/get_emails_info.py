import os
import requests
import base64
from bs4 import BeautifulSoup
from PIL import Image
from io import BytesIO
from datetime import datetime

import google.generativeai as genai
from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError

from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# If modifying these scopes, delete the file token.json.
SCOPES = ["https://www.googleapis.com/auth/gmail.readonly"]

def get_email_text_and_html(message):
    """Returns plain text and HTML from a Gmail message.
    If HTML is missing, returns empty string for HTML.
    If plain text is missing, falls back to stripping HTML.
    """
    payload = message.get("payload", {})
    mime_type = payload.get("mimeType", "")
    parts = payload.get("parts", [])

    plain_text = ""
    html_text = ""

    # Case 1: Plain text only
    if mime_type == "text/plain":
        data = payload.get("body", {}).get("data", "")
        plain_text = base64.urlsafe_b64decode(data).decode("utf-8")

    # Case 2: HTML only
    elif mime_type == "text/html":
        data = payload.get("body", {}).get("data", "")
        html_text = base64.urlsafe_b64decode(data).decode("utf-8")
        plain_text = BeautifulSoup(html_text, "html.parser").get_text(separator="\n")

    # Case 3: Multipart email
    elif mime_type.startswith("multipart/"):
        for part in parts:
            part_type = part.get("mimeType", "")
            data = part.get("body", {}).get("data", "")
            if part_type == "text/plain" and data:
                plain_text = base64.urlsafe_b64decode(data).decode("utf-8")
            elif part_type == "text/html" and data:
                html_text = base64.urlsafe_b64decode(data).decode("utf-8")

        # Fallback if plain text missing
        if not plain_text and html_text:
            plain_text = BeautifulSoup(html_text, "html.parser").get_text(separator="\n")

    return plain_text, html_text


def get_html_from_message_id(service, message_id):
    """Returns plain text and HTML from a Gmail message.
    If HTML is missing, returns empty string for HTML.
    If plain text is missing, falls back to stripping HTML.
    """
    message = service.users().messages().get(userId='me', id=message_id, format='full').execute()
    payload = message.get("payload", {})
    mime_type = payload.get("mimeType", "")
    parts = payload.get("parts", [])

    html_text = ""

    # HTML only
    if mime_type == "text/html":
        data = payload.get("body", {}).get("data", "")
        html_text = base64.urlsafe_b64decode(data).decode("utf-8")

    # Multipart email
    elif mime_type.startswith("multipart/"):
        for part in parts:
            part_type = part.get("mimeType", "")
            data = part.get("body", {}).get("data", "")
            if part_type == "text/html" and data:
                html_text = base64.urlsafe_b64decode(data).decode("utf-8")
    
    if not html_text:
        html_text = "<html><body><p>Message cannot be displayed.</p></body></html>"
    
    return html_text


def get_img_links_from_html(html):
    """Extracts all image src links from an HTML string."""
    soup = BeautifulSoup(html, "html.parser")
    img_tags = soup.find_all("img")
    return [img.get("src") for img in img_tags if img.get("src")]

def preprocess_plain_text(plain_text):
    """Preprocesses plain text."""
    import re
    
    # Remove any HTML tags that might be in the "plain text"
    plain_text = re.sub(r'<[^>]+>', '', plain_text)
    
    # Replace all Unicode whitespace characters (including non-breaking spaces) with regular spaces
    plain_text = re.sub(r'\s+', ' ', plain_text)
    
    # Remove all links (both http and https)
    plain_text = ' '.join(part for part in plain_text.split() if not part.startswith(("www", "http", "https", "<https", "<http", "<www")))
    
    # Remove any remaining multiple spaces and strip
    plain_text = re.sub(r'\s+', ' ', plain_text).strip()
    
    return plain_text

def run_authorization_server():
    # The file token.json stores the user's access and refresh tokens, and is
    # created automatically when the authorization flow completes for the first
    # time.
    if os.path.exists("token.json"):
        creds = Credentials.from_authorized_user_file("token.json", SCOPES)
    # If there are no (valid) credentials available, let the user log in.
    if not creds or not creds.valid:
        if creds and creds.expired and creds.refresh_token:
            creds.refresh(Request())
        else:
            flow = InstalledAppFlow.from_client_secrets_file("credentials.json", SCOPES)
            creds = flow.run_local_server(port=0)
        # Save the credentials for the next run
        with open("token.json", "w") as token:
            token.write(creds.to_json())
    return creds

def gemini_image_ocr(image_url):
    """
    Extract text from an image URL using Google Gemini OCR.
    """
    # Configure Gemini API
    genai.configure(api_key=os.getenv("GEMINI_API_KEY"))
    
    try:
        # Add headers to mimic a browser request
        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
        }

        # Download the image
        response = requests.get(image_url, headers=headers, timeout=10)
        response.raise_for_status()  # Will throw an error for 4xx/5xx responses

        # Check if the response is actually an image
        content_type = response.headers.get('Content-Type', '')
        if 'image' not in content_type:
            raise ValueError(f"URL did not return an image. Content-Type: {content_type}")

        # Open the image with PIL
        image = Image.open(BytesIO(response.content))
        
        # Convert to RGB if necessary (some formats might cause issues)
        if image.mode != 'RGB':
            image = image.convert('RGB')

        # Get the Gemini model
        model = genai.GenerativeModel('gemini-1.5-flash')
        
        # Perform OCR using Gemini
        prompt = "Extract all text from this image. Return only the text content as a string, nothing else. If there is no readable text, return an empty string."
        
        response = model.generate_content([prompt, image])
        
        return ' '.join(response.text.split()).strip() if response.text else ""
    except requests.exceptions.RequestException as e:
        return ""
    except Exception as e:
        return ""

def get_text_from_images(img_links):
    """Use OCR to extract text from image links."""
    text = ""
    for img_link in img_links:
        img_text = gemini_image_ocr(img_link)
        img_text = img_text.replace('"', '')
        img_text = img_text.replace('`', '')
        if img_text:
            text += " " + img_text
    return text.strip()

def get_email_sender(service, message_id):
    """Fetch the email sender from the Gmail API."""
    try:
        message = service.users().messages().get(userId="me", id=message_id).execute()
        return message.get("payload", {}).get("headers", [{}])[0].get("value", "")
    except Exception as e:
        print(f"Error fetching email sender: {e}")
        return ""

def get_email_sender(message):
    """Fetch the email sender from the Gmail API."""
    headers = message.get("payload", {}).get("headers", [])
    for header in headers:
        if header.get("name", "").lower() == "from":
            return header.get("value", "")
    return ""

def get_email_subject(message):
    """Fetch the email subject from the Gmail API."""
    headers = message.get("payload", {}).get("headers", [])
    for header in headers:
        if header.get("name", "").lower() == "subject":
            return header.get("value", "")
    return ""

def get_email_timestamp(message):
    """Fetch the email timestamp from the Gmail API."""
    # Gmail API returns internalDate as a string of milliseconds since epoch
    timestamp_ms = message.get("internalDate")
    if timestamp_ms:
        return datetime.fromtimestamp(int(timestamp_ms) / 1000)
    return ""

def get_emails_info():
    """Reads first email from Gmail and extracts text and from plain text and images."""

    creds = run_authorization_server()

    try:
        # Call the Gmail API
        service = build("gmail", "v1", credentials=creds)
        results = (
            service.users().messages().list(userId="me", labelIds=["CATEGORY_PROMOTIONS"]).execute()
        )
        messages = results.get("messages", [])
        emails_info = {}

        for message in messages[:50]:
            message_id = message["id"]

            message_object = service.users().messages().get(userId="me", id=message_id).execute()

            # Get both plain text and html
            plain_text, html_text = get_email_text_and_html(message_object)

            # remove extra spaces and newlines from outside and within the text
            plain_text = preprocess_plain_text(plain_text)

            # Extract img src links
            img_links = get_img_links_from_html(html_text)

            img_text = ""
            # Get text from images using OCR
            if img_links:
                img_text = get_text_from_images(img_links)
                # Append the image text to the plain text
                plain_text += "\n" + img_text

            all_text = "Plain Text: " + plain_text.strip() + "\n Image Text:" + img_text.strip()
            # sender, email_subject, timestamp
            email_sender = get_email_sender(message_object)
            email_subject = get_email_subject(message_object)
            email_timestamp = get_email_timestamp(message_object)
            emails_info[message_id] = {"email_text": all_text, "email_sender": email_sender, "email_subject": email_subject, "email_timestamp": email_timestamp}

        return emails_info

    except Exception as error:
        print(f"An error occurred: {error}")
        return {}