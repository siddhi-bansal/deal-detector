"""
Authentication routes for Google OAuth and JWT tokens
"""
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from google.auth.transport import requests as google_requests
from google.oauth2 import id_token
import requests

from database.connection import get_db
from core.security import create_access_token, verify_token
from .schemas import (
    GoogleAuthRequest, TokenResponse, UserResponse, 
    GoogleUserInfo, GmailConnectionStatus
)
from .crud import (
    get_user_by_google_id, create_user_from_google, 
    update_user_login, get_user_by_id
)
from core.config import settings

router = APIRouter(prefix="/auth", tags=["authentication"])
security = HTTPBearer()

async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
) -> UserResponse:
    """Get current authenticated user"""
    token = credentials.credentials
    payload = verify_token(token)
    
    if payload is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    user_id: str = payload.get("sub")
    if user_id is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    user = get_user_by_id(db, user_id=int(user_id))
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    return UserResponse.from_orm(user)

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

# Gmail OAuth flow endpoints will be added in next phase
@router.get("/gmail/connect")
async def connect_gmail(current_user: UserResponse = Depends(get_current_user)):
    """Start Gmail OAuth flow"""
    # TODO: Implement Gmail OAuth flow
    return {"message": "Gmail OAuth flow not implemented yet"}

@router.post("/gmail/disconnect")
async def disconnect_gmail(
    current_user: UserResponse = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Disconnect Gmail account"""
    # TODO: Implement Gmail disconnection
    return {"message": "Gmail disconnection not implemented yet"}
