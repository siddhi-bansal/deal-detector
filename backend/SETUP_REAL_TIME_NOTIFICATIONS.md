# 🔔 Setting Up Real-Time Gmail Notifications

This guide will help you set up real-time notifications for when new promotional emails arrive in users' Gmail accounts.

## 📋 Prerequisites

1. **Google Cloud Project**: `deal-detector-468200` (✅ You have this!)
2. **Railway Account**: Your backend is already deployed
3. **Google Cloud Console Access**: You need to enable APIs and create credentials

## 🚀 Step 1: Google Cloud Setup

### 1.1 Enable Required APIs
Run these commands in Google Cloud Shell or with gcloud CLI:

```bash
# Enable Pub/Sub API
gcloud services enable pubsub.googleapis.com --project=deal-detector-468200

# Enable Gmail API (should already be enabled)
gcloud services enable gmail.googleapis.com --project=deal-detector-468200
```

### 1.2 Set up Authentication
```bash
# Set your project
gcloud config set project deal-detector-468200

# Create a service account for Railway
gcloud iam service-accounts create railway-pubsub-service \
    --description="Service account for Railway Pub/Sub operations" \
    --display-name="Railway Pub/Sub Service"

# Grant Pub/Sub permissions
gcloud projects add-iam-policy-binding deal-detector-468200 \
    --member="serviceAccount:railway-pubsub-service@deal-detector-468200.iam.gserviceaccount.com" \
    --role="roles/pubsub.admin"

# Create and download key
gcloud iam service-accounts keys create railway-service-key.json \
    --iam-account=railway-pubsub-service@deal-detector-468200.iam.gserviceaccount.com
```

## 🚀 Step 2: Run Setup Script

### 2.1 Set Environment Variables
Add these to your Railway environment:

```bash
GOOGLE_CLOUD_PROJECT_ID=deal-detector-468200
GMAIL_TOPIC_NAME=gmail-notifications
GOOGLE_APPLICATION_CREDENTIALS=/path/to/railway-service-key.json
```

### 2.2 Run the Setup Script
```bash
cd backend
python setup_gmail_notifications.py
```

This will create:
- Pub/Sub Topic: `gmail-notifications`
- Pub/Sub Subscription: `gmail-notifications-subscription` 
- Webhook URL: `https://deal-detector-production.up.railway.app/webhooks/gmail`

## 🚀 Step 3: Deploy Changes

### 3.1 Update Railway Environment
In Railway Dashboard, add:
- `GOOGLE_CLOUD_PROJECT_ID=deal-detector-468200`
- `GMAIL_TOPIC_NAME=gmail-notifications`
- Upload your service account JSON file or set the contents as an environment variable

### 3.2 Deploy Backend
```bash
# Your backend should automatically redeploy when you push changes
git add .
git commit -m "Add real-time Gmail notifications"
git push
```

## 🚀 Step 4: Test the System

### 4.1 Enable Gmail Watch for a User
When a user connects their Gmail, call this function:

```python
from setup_gmail_notifications import setup_user_gmail_watch

result = setup_user_gmail_watch(
    user_email="your-email@gmail.com",
    gmail_access_token="user_access_token",
    gmail_refresh_token="user_refresh_token"
)
```

### 4.2 Test with a Real Email
1. Send yourself a promotional email
2. Check Railway logs for webhook activity
3. Verify coupon extraction and processing

## 🔧 Database Updates Needed

You'll need to add these fields to your User table:

```sql
ALTER TABLE users ADD COLUMN gmail_history_id VARCHAR(255);
ALTER TABLE users ADD COLUMN gmail_watch_expiration TIMESTAMP;
```

## 📱 Next Steps: Mobile Push Notifications

1. **Install Expo Push Notifications**:
   ```bash
   expo install expo-notifications
   ```

2. **Get Push Token** in your React Native app:
   ```javascript
   import * as Notifications from 'expo-notifications';
   
   const token = await Notifications.getExpoPushTokenAsync();
   // Send this token to your backend to store with the user
   ```

3. **Send Push Notifications** from your backend:
   ```python
   import requests
   
   def send_push_notification(expo_token, coupon_data):
       message = {
           "to": expo_token,
           "title": f"New Coupon from {coupon_data['sender']}!",
           "body": coupon_data['description'],
           "data": coupon_data
       }
       
       response = requests.post(
           "https://exp.host/--/api/v2/push/send",
           json=message,
           headers={"Content-Type": "application/json"}
       )
   ```

## 🐛 Troubleshooting

### Common Issues:

1. **"Topic already exists"** - This is normal, the script handles it
2. **"Permission denied"** - Check your service account permissions
3. **"Webhook not receiving data"** - Verify your Railway URL is accessible
4. **"Gmail watch expired"** - Watches expire after 7 days, you need to renew them

### Debug Commands:
```bash
# Check if topic exists
gcloud pubsub topics list --project=deal-detector-468200

# Check if subscription exists  
gcloud pubsub subscriptions list --project=deal-detector-468200

# Test webhook manually
curl -X POST https://deal-detector-production.up.railway.app/webhooks/gmail \
     -H "Content-Type: application/json" \
     -d '{"message": {"data": "eyJ0ZXN0IjogInRydWUifQ=="}}'
```

## 🎉 What You'll Get

Once set up, your app will:

1. **Instantly detect** new promotional emails
2. **Extract coupons** automatically using AI
3. **Send push notifications** to users' phones
4. **Store coupon data** in your database
5. **Update the frontend** in real-time

This creates a truly **real-time coupon discovery experience**! 🚀
