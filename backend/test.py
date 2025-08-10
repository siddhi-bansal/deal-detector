# Gets the latest 'Promotions' email using Gmail API, for testing purposes only

import os
import requests
import base64
from bs4 import BeautifulSoup
from PIL import Image
from io import BytesIO
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

creds = run_authorization_server()

# Call the Gmail API
service = build("gmail", "v1", credentials=creds)
results = (
    service.users().messages().list(userId="me", labelIds=["CATEGORY_PROMOTIONS"]).execute()
)
messages = results.get("messages", [])
all_emails_text = {}

for message in messages[0:1]:
    print(message["id"])


from get_all_text_from_email import get_email_text_and_html, get_img_links_from_html, get_text_from_images, preprocess_plain_text, get_email_sender, get_email_subject, get_email_timestamp

emails_info = {}

for message in messages[0:1]:
    print(message.get("payload", {}))
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
    # if img_links:
    #     img_text = get_text_from_images(img_links)
    #     # Append the image text to the plain text
    #     plain_text += "\n" + img_text

    all_text = "Plain Text: " + plain_text.strip() + "\n Image Text:" + img_text.strip()
    # sender, email_subject, timestamp
    email_sender = get_email_sender(message_object)
    email_subject = get_email_subject(message_object)
    email_timestamp = get_email_timestamp(message_object)
    emails_info[message_id] = {"email_sender": email_sender, "email_subject": email_subject, "email_timestamp": email_timestamp}

print(emails_info)