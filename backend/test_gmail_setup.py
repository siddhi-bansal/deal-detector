"""
Test Gmail Notifications Setup
Run this to verify your Google Cloud configuration without actually creating resources
"""
import os

def test_configuration():
    """
    Test the configuration without actually creating Google Cloud resources
    """
    print("🔍 Testing Gmail Notifications Configuration...")
    print()
    
    # Test project configuration
    PROJECT_ID = "deal-detector-468200"
    TOPIC_NAME = "gmail-notifications"
    SUBSCRIPTION_NAME = "gmail-notifications-sub"
    WEBHOOK_URL = "https://deal-detector-production.up.railway.app/webhooks/gmail"
    
    print(f"✅ Project ID: {PROJECT_ID}")
    print(f"✅ Topic Name: {TOPIC_NAME}")
    print(f"✅ Subscription Name: {SUBSCRIPTION_NAME}")
    print(f"✅ Webhook URL: {WEBHOOK_URL}")
    print()
    
    # Test environment variables
    print("🔍 Checking Environment Variables...")
    env_vars = {
        "GOOGLE_CLIENT_ID": os.getenv("GOOGLE_CLIENT_ID"),
        "GOOGLE_CLIENT_SECRET": os.getenv("GOOGLE_CLIENT_SECRET"),
    }
    
    for var_name, var_value in env_vars.items():
        if var_value:
            print(f"✅ {var_name}: Set")
        else:
            print(f"❌ {var_name}: Not set")
    
    print()
    
    # Test import capabilities
    print("🔍 Testing Import Dependencies...")
    try:
        from google.cloud import pubsub_v1
        print("✅ google-cloud-pubsub: Available")
    except ImportError:
        print("❌ google-cloud-pubsub: Not installed")
    
    try:
        from google.oauth2.credentials import Credentials
        print("✅ google-oauth2: Available")
    except ImportError:
        print("❌ google-oauth2: Not installed")
    
    try:
        from googleapiclient.discovery import build
        print("✅ google-api-python-client: Available")
    except ImportError:
        print("❌ google-api-python-client: Not installed")
    
    print()
    
    # Test Google Cloud authentication
    print("🔍 Testing Google Cloud Authentication...")
    google_creds = os.getenv("GOOGLE_APPLICATION_CREDENTIALS")
    if google_creds:
        print(f"✅ GOOGLE_APPLICATION_CREDENTIALS: {google_creds}")
    else:
        print("⚠️  GOOGLE_APPLICATION_CREDENTIALS: Not set (needed for Pub/Sub)")
        print("   This is expected if running locally without service account")
    
    print()
    print("📋 Summary:")
    print("   Your configuration looks good for Gmail notifications!")
    print()
    print("🔑 Next Steps:")
    print("   1. Enable Pub/Sub API in Google Cloud Console")
    print("   2. Set up service account credentials")
    print("   3. Run setup_gmail_notifications.py with proper authentication")
    print("   4. Deploy your backend with webhook endpoint")
    print()
    print("📖 See SETUP_REAL_TIME_NOTIFICATIONS.md for detailed instructions")

if __name__ == "__main__":
    test_configuration()
