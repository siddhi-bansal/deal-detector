"""
Pydantic schemas for authentication
"""
from typing import Optional
from datetime import datetime
from pydantic import BaseModel, EmailStr

# User schemas
class UserBase(BaseModel):
    email: EmailStr
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    profile_picture: Optional[str] = None

class UserCreate(UserBase):
    google_id: str

class UserUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    profile_picture: Optional[str] = None

class UserResponse(UserBase):
    id: int
    google_id: str
    gmail_connected: bool
    created_at: datetime
    last_login: Optional[datetime] = None
    
    class Config:
        from_attributes = True

# Authentication schemas
class GoogleAuthRequest(BaseModel):
    id_token: str

class GoogleCallbackRequest(BaseModel):
    code: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse

class GoogleUserInfo(BaseModel):
    """Schema for Google user info from OAuth"""
    id: str
    email: str
    given_name: Optional[str] = None
    family_name: Optional[str] = None
    picture: Optional[str] = None

# Gmail integration schemas
class GmailConnectionStatus(BaseModel):
    connected: bool
    last_sync: Optional[datetime] = None
    
class GmailTokens(BaseModel):
    access_token: str
    refresh_token: Optional[str] = None
    expires_in: int
