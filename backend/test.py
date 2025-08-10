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