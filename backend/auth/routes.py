"""
Authentication routes for Google OAuth and JWT tokens
"""
from typing import Optional
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.responses import RedirectResponse
from sqlalchemy.orm import Session
from google.auth.transport import requests as google_requests
from google.oauth2 import id_token
from google.auth.transport.requests import Request
from google_auth_oauthlib.flow import Flow
import requests
import json
import logging
from urllib.parse import urlencode, quote

# Set up logging
logger = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO)

from database.connection import get_db
from core.security import create_access_token, verify_token
from .schemas import (
    GoogleAuthRequest, TokenResponse, UserResponse,
    GoogleUserInfo, GmailConnectionStatus, GoogleCallbackRequest
)
from .crud import (
    get_user_by_google_id, create_user_from_google,
    update_user_login, update_gmail_tokens, get_user_by_id, disconnect_gmail
)
from core.config import settings

router = APIRouter(prefix="/auth", tags=["authentication"])
security = HTTPBearer()

async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
) -> UserResponse:
    """Get current authenticated user"""
    try:
        token = credentials.credentials
        logger.info(f"Verifying token: {token[:20]}...")
        
        payload = verify_token(token)
        logger.info(f"Token verification result: {payload is not None}")
        
        if payload is None:
            logger.warning("Token verification failed - invalid token")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid authentication credentials",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        user_id: str = payload.get("sub")
        logger.info(f"Extracted user_id from token: {user_id}")
        
        if user_id is None:
            logger.warning("No user_id in token payload")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid authentication credentials",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        logger.info(f"Looking up user with ID: {user_id}")
        user = get_user_by_id(db, user_id=int(user_id))
        
        if user is None:
            logger.warning(f"User not found in database: {user_id}")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User not found",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        logger.info(f"User authentication successful: {user.email}")
        
        # Create UserResponse with explicit field checking
        try:
            logger.info(f"Creating UserResponse for user: {user.id}")
            logger.info(f"User fields available: {[attr for attr in dir(user) if not attr.startswith('_')]}")
            
            # Check each field explicitly before creating the response
            user_data = {}
            
            # Required fields
            user_data['id'] = getattr(user, 'id', None)
            user_data['email'] = getattr(user, 'email', None)
            user_data['google_id'] = getattr(user, 'google_id', None)
            user_data['gmail_connected'] = getattr(user, 'gmail_connected', False)
            user_data['created_at'] = getattr(user, 'created_at', None)
            
            # Optional fields with defaults
            user_data['first_name'] = getattr(user, 'first_name', None)
            user_data['last_name'] = getattr(user, 'last_name', None)
            user_data['profile_picture'] = getattr(user, 'profile_picture', None)
            user_data['updated_at'] = getattr(user, 'updated_at', user_data['created_at'])
            user_data['last_login'] = getattr(user, 'last_login', None)
            
            logger.info(f"User data prepared: {user_data}")
            
            # Verify required fields are not None
            if not user_data['id'] or not user_data['email'] or not user_data['google_id']:
                logger.error(f"Missing required fields: id={user_data['id']}, email={user_data['email']}, google_id={user_data['google_id']}")
                raise ValueError("Missing required user fields")
            
            user_response = UserResponse(**user_data)
            
            logger.info("UserResponse created successfully")
            return user_response
            
        except Exception as response_error:
            logger.error(f"Error creating UserResponse: {str(response_error)}")
            logger.error(f"Response error type: {type(response_error).__name__}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"User response creation error: {str(response_error)}"
            )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Unexpected error in get_current_user: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Authentication error: {str(e)}"
        )

@router.get("/google/test")
async def test_oauth_callback():
    """
    Test endpoint to verify OAuth callback route is working
    """
    logger.info("=== OAUTH TEST ENDPOINT HIT ===")
    return {"message": "OAuth callback route is working", "timestamp": str(datetime.now())}

@router.get("/google/callback")
async def google_oauth_callback_redirect(
    code: str,
    state: str = None,
    db: Session = Depends(get_db)
):
    """
    Handle Google OAuth callback and redirect to mobile app
    """
    logger.info("=== GOOGLE OAUTH CALLBACK STARTED ===")
    logger.info(f"Received authorization code: {code[:20]}...")  # Log first 20 chars for security
    logger.info(f"State parameter: {state}")  # Log state for debugging
    
    # Check if this is a Gmail connection request
    is_gmail_connect = state and state.startswith("gmail_connect_")
    user_id_from_state = None
    
    if is_gmail_connect:
        try:
            user_id_from_state = int(state.split("gmail_connect_")[1])
            logger.info(f"Gmail connection request for user ID: {user_id_from_state}")
        except (IndexError, ValueError):
            logger.error(f"Invalid state format for Gmail connection: {state}")
            error_url = f"dealdetector://auth?error={quote('Invalid Gmail connection request')}"
            return RedirectResponse(url=error_url)
    
    # Debug settings values
    logger.info(f"Settings debug - client_id: {settings.google_client_id is not None}")
    logger.info(f"Settings debug - client_secret: {settings.google_client_secret is not None}")
    logger.info(f"Settings debug - redirect_uri: {settings.google_redirect_uri}")
    
    if not settings.google_client_id:
        logger.error("GOOGLE_CLIENT_ID is None or empty!")
        error_url = f"dealdetector://auth?error={quote('Missing Google Client ID configuration')}"
        return RedirectResponse(url=error_url)
        
    if not settings.google_client_secret:
        logger.error("GOOGLE_CLIENT_SECRET is None or empty!")
        error_url = f"dealdetector://auth?error={quote('Missing Google Client Secret configuration')}"
        return RedirectResponse(url=error_url)
        
    if not settings.google_redirect_uri:
        logger.error("GOOGLE_REDIRECT_URI is None or empty!")
        error_url = f"dealdetector://auth?error={quote('Missing Google Redirect URI configuration')}"
        return RedirectResponse(url=error_url)
    
    try:
        # Exchange authorization code for tokens
        logger.info("Step 1: Exchanging authorization code for tokens")
        token_url = "https://oauth2.googleapis.com/token"
        token_data = {
            "client_id": settings.google_client_id,
            "client_secret": settings.google_client_secret,
            "code": code,
            "grant_type": "authorization_code",
            "redirect_uri": settings.google_redirect_uri,
        }
        
        logger.info(f"Token request data: client_id={settings.google_client_id[:20]}..., redirect_uri={settings.google_redirect_uri}")
        
        token_response = requests.post(token_url, data=token_data)
        logger.info(f"Token response status: {token_response.status_code}")
        logger.info(f"Token response content: {token_response.text}")
        
        if not token_response.ok:
            logger.error(f"Token exchange failed: {token_response.text}")
            
        token_response.raise_for_status()
        tokens = token_response.json()
        logger.info("Token exchange successful")
        logger.info(f"Tokens received: {list(tokens.keys()) if tokens else 'None'}")
        
        if not tokens or 'access_token' not in tokens:
            logger.error(f"No access token in response: {tokens}")
            raise Exception("No access token received from Google")
        
        # Get user info using access token
        logger.info("Step 2: Getting user info from Google")
        user_info_url = f"https://www.googleapis.com/oauth2/v2/userinfo?access_token={tokens['access_token']}"
        user_response = requests.get(user_info_url)
        logger.info(f"User info response status: {user_response.status_code}")
        
        if not user_response.ok:
            logger.error(f"User info request failed: {user_response.text}")
            
        user_response.raise_for_status()
        user_data = user_response.json()
        logger.info(f"User info received for email: {user_data.get('email')}")
        
        # Create GoogleUserInfo object
        google_user = GoogleUserInfo(
            id=user_data['id'],
            email=user_data['email'],
            given_name=user_data.get('given_name'),
            family_name=user_data.get('family_name'),
            picture=user_data.get('picture')
        )
        
        logger.info("Step 3: Processing user in database")
        
        if is_gmail_connect:
            # This is a Gmail connection request for an existing user
            logger.info(f"Processing Gmail connection for user ID: {user_id_from_state}")
            user = get_user_by_id(db, user_id_from_state)
            
            if not user:
                logger.error(f"User not found for Gmail connection: {user_id_from_state}")
                logger.error(f"Available user IDs in database:")
                # Debug: List some users to see what's in the database
                try:
                    from .models import User
                    sample_users = db.query(User).limit(5).all()
                    for u in sample_users:
                        logger.error(f"  User ID: {u.id}, Email: {u.email}")
                except Exception as e:
                    logger.error(f"Error querying users: {e}")
                    
                error_url = f"dealdetector://auth?error={quote('User not found for Gmail connection')}"
                return RedirectResponse(url=error_url)
            
            # Verify the Google account matches the user's email
            if user.email != google_user.email:
                logger.error(f"Email mismatch: user {user.email} vs Google {google_user.email}")
                error_url = f"dealdetector://auth?error={quote('Email mismatch - please use the same Google account')}"
                return RedirectResponse(url=error_url)
                
        else:
            # This is a regular OAuth login/signup
            user = get_user_by_google_id(db, google_user.id)
            
            if not user:
                logger.info("Creating new user")
                user = create_user_from_google(db, google_user)
            else:
                logger.info(f"Updating existing user: {user.email}")
                user = update_user_login(db, user)
        
        # Store Gmail tokens since we have Gmail scopes
        logger.info("Step 3.5: Storing Gmail tokens")
        from datetime import datetime, timedelta
        
        # Calculate token expiry (Google tokens typically expire in 1 hour)
        expires_in_seconds = tokens.get('expires_in', 3600)
        expires_at = datetime.utcnow() + timedelta(seconds=expires_in_seconds)
        
        # Store the Gmail tokens
        user = update_gmail_tokens(
            db=db,
            user=user,
            access_token=tokens['access_token'],
            refresh_token=tokens.get('refresh_token'),  # Only provided on first auth
            expires_at=expires_at
        )
        logger.info("Gmail tokens stored successfully")
        
        # Step 5: Handle redirect based on request type
        if is_gmail_connect:
            # For Gmail connection, redirect with success message
            logger.info("Step 5: Gmail connection successful, redirecting")
            redirect_url = f"dealdetector://gmail?connected=true&message={quote('Gmail connected successfully')}"
        else:
            # For regular auth, redirect with JWT token and user data
            logger.info("Step 4: Creating JWT token")
            access_token = create_access_token(
                data={"sub": str(user.id), "email": user.email}
            )
            logger.info("JWT token created successfully")
            
            # Create user data for mobile app
            user_data_for_mobile = {
                "id": user.id,
                "email": user.email,
                "first_name": user.first_name,
                "last_name": user.last_name,
                "profile_picture": user.profile_picture,
                "gmail_connected": user.gmail_connected,
                "created_at": user.created_at.isoformat(),
                "last_login": user.last_login.isoformat() if user.last_login else None
            }
            
            # Redirect back to mobile app with auth data
            redirect_url = f"dealdetector://auth?token={access_token}&user={quote(json.dumps(user_data_for_mobile))}"
        
        logger.info(f"Step 5: Redirecting to mobile app: {redirect_url[:50]}...")
        
        # Return redirect response
        return RedirectResponse(url=redirect_url)
        
    except requests.RequestException as e:
        logger.error(f"Request error in OAuth callback: {str(e)}")
        # Redirect to app with error
        error_url = f"dealdetector://auth?error={quote(str(e))}"
        logger.info(f"Redirecting with error: {error_url}")
        return RedirectResponse(url=error_url)
    except Exception as e:
        logger.error(f"Unexpected error in OAuth callback: {str(e)}")
        # Redirect to app with error
        error_url = f"dealdetector://auth?error={quote(f'Authentication failed: {str(e)}')}"
        logger.info(f"Redirecting with error: {error_url}")
        return RedirectResponse(url=error_url)

@router.post("/google", response_model=TokenResponse)
async def google_auth(
    auth_request: GoogleAuthRequest,
    db: Session = Depends(get_db)
):
    """
    Authenticate user with Google ID token
    """
    try:
        # Verify the Google ID token
        idinfo = id_token.verify_oauth2_token(
            auth_request.id_token, 
            google_requests.Request(), 
            settings.google_client_id
        )
        
        # Extract user info from token
        google_user = GoogleUserInfo(
            id=idinfo['sub'],
            email=idinfo['email'],
            given_name=idinfo.get('given_name'),
            family_name=idinfo.get('family_name'),
            picture=idinfo.get('picture')
        )
        
        # Check if user exists
        user = get_user_by_google_id(db, google_user.id)
        
        if not user:
            # Create new user
            user = create_user_from_google(db, google_user)
        else:
            # Update last login
            user = update_user_login(db, user)
        
        # Create JWT token
        access_token = create_access_token(
            data={"sub": str(user.id), "email": user.email}
        )
        
        return TokenResponse(
            access_token=access_token,
            user=UserResponse.from_orm(user)
        )
        
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid Google token: {str(e)}"
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Authentication failed: {str(e)}"
        )

@router.get("/me", response_model=UserResponse)
async def get_current_user_info(
    current_user: UserResponse = Depends(get_current_user)
):
    """Get current user information"""
    return current_user

@router.get("/gmail/status", response_model=GmailConnectionStatus)
async def get_gmail_status(
    current_user: UserResponse = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get Gmail connection status for current user"""
    user = get_user_by_id(db, current_user.id)
    return GmailConnectionStatus(
        connected=user.gmail_connected,
        last_sync=user.updated_at if user.gmail_connected else None
    )

@router.post("/logout")
async def logout(current_user: UserResponse = Depends(get_current_user)):
    """
    Logout user (client should delete the token)
    In a more sophisticated setup, we could maintain a blacklist of tokens
    """
    return {"message": "Successfully logged out"}

# Gmail connection endpoints
@router.get("/gmail/connect")
async def connect_gmail(current_user: UserResponse = Depends(get_current_user)):
    """Start Gmail OAuth flow"""
    try:
        logger.info(f"Gmail connect request from user ID: {current_user.id}, email: {current_user.email}")
        
        # Create OAuth URL specifically for Gmail connection
        gmail_scopes = [
            'https://www.googleapis.com/auth/gmail.readonly',
            'https://www.googleapis.com/auth/gmail.modify'
        ]
        
        state_param = f"gmail_connect_{current_user.id}"
        logger.info(f"Creating state parameter: {state_param}")
        
        oauth_url = (
            f"https://accounts.google.com/o/oauth2/v2/auth?"
            f"client_id={settings.google_client_id}&"
            f"redirect_uri={settings.google_redirect_uri}&"
            f"response_type=code&"
            f"scope={quote(' '.join(gmail_scopes))}&"
            f"access_type=offline&"
            f"prompt=consent&"
            f"state={state_param}"  # Include user ID in state
        )
        
        logger.info(f"Generated OAuth URL: {oauth_url}")
        
        return {
            "oauth_url": oauth_url,
            "instructions": "Open this URL to connect your Gmail account"
        }
    except Exception as e:
        logger.error(f"Error creating Gmail connection URL: {e}")
        raise HTTPException(
            status_code=500,
            detail="Failed to create Gmail connection URL"
        )

@router.post("/gmail/disconnect")
async def disconnect_gmail_endpoint(
    current_user: UserResponse = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Disconnect Gmail account"""
    try:
        user = get_user_by_id(db, current_user.id)
        user = disconnect_gmail(db, user)
        
        return {
            "message": "Gmail disconnected successfully",
            "connected": user.gmail_connected
        }
    except Exception as e:
        logger.error(f"Error disconnecting Gmail: {e}")
        raise HTTPException(
            status_code=500,
            detail="Failed to disconnect Gmail"
        )
