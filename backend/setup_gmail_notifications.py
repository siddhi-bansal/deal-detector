"""
Real-time Gmail Notifications Setup
This script sets up Google Cloud Pub/Sub for real-time Gmail notifications
"""
import os
import json
from google.cloud import pubsub_v1
from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build

# Your Google Cloud Project details
PROJECT_ID = "deal-detector-468200"  # Your actual project ID!
TOPIC_NAME = "gmail-notifications"
SUBSCRIPTION_NAME = "gmail-notifications-sub"
WEBHOOK_URL = "https://deal-detector-production.up.railway.app/webhooks/gmail"

def setup_gmail_push_notifications():
    """
    Set up the Google Cloud Pub/Sub infrastructure for Gmail notifications
    """
    print("Setting up Gmail Push Notifications...")
    print(f"Project ID: {PROJECT_ID}")
    print(f"Topic Name: {TOPIC_NAME}")
    print(f"Webhook URL: {WEBHOOK_URL}")
    
    # Create Pub/Sub topic if it doesn't exist
    publisher = pubsub_v1.PublisherClient()
    topic_path = publisher.topic_path(PROJECT_ID, TOPIC_NAME)
    
    try:
        publisher.create_topic(request={"name": topic_path})
        print(f"Created topic: {topic_path}")
    except Exception as e:
        print(f"Topic might already exist: {e}")
    
    # Create Pub/Sub subscription with push to your webhook
    subscriber = pubsub_v1.SubscriberClient()
    subscription_path = subscriber.subscription_path(PROJECT_ID, f"{TOPIC_NAME}-subscription")
    
    push_config = pubsub_v1.PushConfig(push_endpoint=WEBHOOK_URL)
    
    try:
        subscriber.create_subscription(
            request={
                "name": subscription_path,
                "topic": topic_path,
                "push_config": push_config,
            }
        )
        print(f"Created subscription: {subscription_path}")
    except Exception as e:
        print(f"Subscription might already exist: {e}")
    
    print("Gmail Push Notifications setup complete!")
    print(f"Your webhook endpoint: {WEBHOOK_URL}")
    print("\nNext steps:")
    print("1. Make sure your Railway app has the webhook endpoint deployed")
    print("2. Call setup_user_gmail_watch() for each user to start watching their emails")

def setup_user_gmail_watch(user_email: str, gmail_access_token: str, gmail_refresh_token: str):
    """
    Set up Gmail watch for a specific user's promotional emails
    Call this when a user connects their Gmail account
    """
    try:
        # Create Gmail service for this user
        user_creds = Credentials(
            token=gmail_access_token,
            refresh_token=gmail_refresh_token,
            token_uri="https://oauth2.googleapis.com/token",
            client_id=os.getenv("GOOGLE_CLIENT_ID"),
            client_secret=os.getenv("GOOGLE_CLIENT_SECRET"),
            scopes=[
                'https://www.googleapis.com/auth/gmail.readonly',
                'https://www.googleapis.com/auth/gmail.modify'
            ]
        )
        
        gmail_service = build('gmail', 'v1', credentials=user_creds)
        
        # Set up watch request for CATEGORY_PROMOTIONS only
        watch_request = {
            'labelIds': ['CATEGORY_PROMOTIONS'],  # Only promotional emails!
            'topicName': f'projects/{PROJECT_ID}/topics/{TOPIC_NAME}'
        }
        
        # Start watching the user's Gmail
        result = gmail_service.users().watch(userId='me', body=watch_request).execute()
        
        print(f"Started watching Gmail for {user_email}")
        print(f"History ID: {result.get('historyId')}")
        print(f"Expiration: {result.get('expiration')}")
        
        return result
        
    except Exception as error:
        print(f"Error setting up Gmail watch for {user_email}: {error}")
        return None

def stop_user_gmail_watch(gmail_access_token: str, gmail_refresh_token: str):
    """
    Stop Gmail watch for a user (when they disconnect Gmail)
    """
    try:
        user_creds = Credentials(
            token=gmail_access_token,
            refresh_token=gmail_refresh_token,
            token_uri="https://oauth2.googleapis.com/token",
            client_id=os.getenv("GOOGLE_CLIENT_ID"),
            client_secret=os.getenv("GOOGLE_CLIENT_SECRET"),
            scopes=[
                'https://www.googleapis.com/auth/gmail.readonly',
                'https://www.googleapis.com/auth/gmail.modify'
            ]
        )
        
        gmail_service = build('gmail', 'v1', credentials=user_creds)
        
        # Stop watching
        gmail_service.users().stop(userId='me').execute()
        print("Stopped watching Gmail")
        
    except Exception as error:
        print(f"Error stopping Gmail watch: {error}")

if __name__ == "__main__":
    # Run this script to set up the Pub/Sub infrastructure
    setup_gmail_push_notifications()
