/**
 * Google OAuth Configuration
 * 
 * To set up Google Sign-In for production:
 * 1. Go to Google Cloud Console (https://console.cloud.google.com/)
 * 2. Create a new project or select existing project
 * 3. Enable Google+ API and Gmail API
 * 4. Create OAuth 2.0 credentials
 * 5. Add your app's package name and SHA-1 certificate fingerprint
 * 6. Replace the placeholder values below with your actual credentials
 */

export const GOOGLE_CONFIG = {
  // Web Client ID (from Google Cloud Console)
  WEB_CLIENT_ID: '989567471375-kp9f2vbn1qpvcif5uqq35a4uf4859vrl.apps.googleusercontent.com',
  
  // iOS Client ID (optional, for iOS app)
  IOS_CLIENT_ID: 'YOUR_IOS_CLIENT_ID_HERE.apps.googleusercontent.com',
  
  // Android Client ID (optional, for Android app)
  ANDROID_CLIENT_ID: 'YOUR_ANDROID_CLIENT_ID_HERE.apps.googleusercontent.com',
  
  // OAuth Scopes for Gmail access
  SCOPES: [
    'https://www.googleapis.com/auth/userinfo.profile',
    'https://www.googleapis.com/auth/userinfo.email',
    'https://www.googleapis.com/auth/gmail.readonly',
    'https://www.googleapis.com/auth/gmail.modify',
  ],
};

// For development/testing - these are placeholder values
export const DEV_CONFIG = {
  WEB_CLIENT_ID: 'dev-web-client-id',
  IOS_CLIENT_ID: 'dev-ios-client-id',
  ANDROID_CLIENT_ID: 'dev-android-client-id',
  SCOPES: GOOGLE_CONFIG.SCOPES,
};

// Use production config for OAuth to work properly
export default GOOGLE_CONFIG;
