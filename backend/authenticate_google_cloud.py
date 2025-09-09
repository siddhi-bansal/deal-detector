"""
Quick Google Cloud Authentication for Testing
This will authenticate with your Google account to test Pub/Sub setup
"""
import os
from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow

def authenticate_user_account():
    """
    Authenticate using your Google account for testing
    """
    # Scopes needed for Pub/Sub
    SCOPES = ['https://www.googleapis.com/auth/cloud-platform']
    
    creds = None
    
    # Check if we have existing credentials
    if os.path.exists('pubsub_token.json'):
        creds = Credentials.from_authorized_user_file('pubsub_token.json', SCOPES)
    
    # If there are no (valid) credentials available, let the user log in
    if not creds or not creds.valid:
        if creds and creds.expired and creds.refresh_token:
            creds.refresh(Request())
        else:
            # Use your existing OAuth credentials
            flow = InstalledAppFlow.from_client_config({
                "installed": {
                    "client_id": os.getenv("GOOGLE_CLIENT_ID"),
                    "client_secret": os.getenv("GOOGLE_CLIENT_SECRET"),
                    "auth_uri": "https://accounts.google.com/o/oauth2/auth",
                    "token_uri": "https://oauth2.googleapis.com/token",
                    "redirect_uris": ["urn:ietf:wg:oauth:2.0:oob", "http://localhost"]
                }
            }, SCOPES)
            
            # Run local server to get credentials
            creds = flow.run_local_server(port=0)
        
        # Save the credentials for the next run
        with open('pubsub_token.json', 'w') as token:
            token.write(creds.to_json())
    
    return creds

if __name__ == "__main__":
    print("🔐 Authenticating with Google Cloud...")
    
    # Load environment variables
    from dotenv import load_dotenv
    load_dotenv()
    
    try:
        creds = authenticate_user_account()
        print("✅ Authentication successful!")
        print(f"✅ Project access: {creds.project_id if hasattr(creds, 'project_id') else 'Available'}")
        
        # Test Pub/Sub access
        from google.cloud import pubsub_v1
        
        # Set credentials in environment
        os.environ['GOOGLE_APPLICATION_CREDENTIALS'] = 'pubsub_token.json'
        
        # Test creating a client
        publisher = pubsub_v1.PublisherClient(credentials=creds)
        print("✅ Pub/Sub client created successfully!")
        
        print("\n🚀 Ready to run setup_gmail_notifications.py!")
        
    except Exception as e:
        print(f"❌ Authentication failed: {e}")
        print("Make sure your GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET are set in .env")
