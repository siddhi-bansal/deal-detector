"""
Core configuration for the Deal Detector API
"""
import os
from typing import Optional
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    # App settings
    app_name: str = "Deal Detector API"
    debug: bool = False
    
    # Database
    database_url: str = "sqlite:///./deal_detector.db"  # Default for local development
    # Note: Railway will override this with PostgreSQL DATABASE_URL automatically
    
    # JWT settings
    secret_key: str = "your-secret-key-change-this-in-production"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 60 * 24 * 7  # 7 days
    
    # Google OAuth settings
    google_client_id: Optional[str] = None
    google_client_secret: Optional[str] = None
    google_redirect_uri: str = "https://deal-detector-production.up.railway.app/auth/google/callback"
    
    # Gmail API settings
    gmail_scopes: list = [
        "https://www.googleapis.com/auth/gmail.readonly",
        "https://www.googleapis.com/auth/userinfo.email",
        "https://www.googleapis.com/auth/userinfo.profile"
    ]
    
    class Config:
        env_file = ".env"
        extra = "ignore"  # Allow extra environment variables

# Create global settings instance
settings = Settings()
