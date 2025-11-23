"""
CRUD operations for authentication
"""
from typing import Optional
from sqlalchemy.orm import Session
from sqlalchemy import and_
from .models import User, UserCoupon
from .schemas import UserCreate, UserUpdate, GoogleUserInfo
from core.security import get_password_hash
import json
from datetime import datetime

def get_user_by_id(db: Session, user_id: int) -> Optional[User]:
    """Get user by ID"""
    return db.query(User).filter(User.id == user_id).first()

def get_user_by_email(db: Session, email: str) -> Optional[User]:
    """Get user by email"""
    return db.query(User).filter(User.email == email).first()

def get_user_by_google_id(db: Session, google_id: str) -> Optional[User]:
    """Get user by Google ID"""
    return db.query(User).filter(User.google_id == google_id).first()

def create_user_from_google(db: Session, google_user: GoogleUserInfo) -> User:
    """Create a new user from Google OAuth data"""
    db_user = User(
        email=google_user.email,
        google_id=google_user.id,
        first_name=google_user.given_name,
        last_name=google_user.family_name,
        profile_picture=google_user.picture,
        last_login=datetime.utcnow()
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

def update_user_login(db: Session, user: User) -> User:
    """Update user's last login timestamp"""
    user.last_login = datetime.utcnow()
    db.commit()
    db.refresh(user)
    return user

def update_user(db: Session, user: User, user_update: UserUpdate) -> User:
    """Update user information"""
    update_data = user_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(user, field, value)
    
    user.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(user)
    return user

def update_gmail_tokens(
    db: Session, 
    user: User, 
    access_token: str, 
    refresh_token: Optional[str] = None,
    expires_at: Optional[datetime] = None
) -> User:
    """Update user's Gmail tokens"""
    user.gmail_access_token = access_token  # TODO: Encrypt this
    if refresh_token:
        user.gmail_refresh_token = refresh_token  # TODO: Encrypt this
    user.gmail_token_expiry = expires_at
    user.gmail_connected = True
    user.updated_at = datetime.utcnow()
    
    db.commit()
    db.refresh(user)
    return user

def disconnect_gmail(db: Session, user: User) -> User:
    """Disconnect user's Gmail account"""
    user.gmail_access_token = None
    user.gmail_refresh_token = None
    user.gmail_token_expiry = None
    user.gmail_connected = False
    user.updated_at = datetime.utcnow()
    
    db.commit()
    db.refresh(user)
    return user

# User coupons CRUD
def create_user_coupon(
    db: Session, 
    user_id: int, 
    email_id: str, 
    coupon_data: dict
) -> UserCoupon:
    """Create a new user coupon"""
    db_coupon = UserCoupon(
        user_id=user_id,
        email_id=email_id,
        coupon_data=json.dumps(coupon_data)
    )
    db.add(db_coupon)
    db.commit()
    db.refresh(db_coupon)
    return db_coupon

def get_user_coupons(db: Session, user_id: int, skip: int = 0, limit: int = 100):
    """Get user's coupons"""
    return db.query(UserCoupon).filter(
        UserCoupon.user_id == user_id
    ).offset(skip).limit(limit).all()

def toggle_coupon_favorite(db: Session, user_id: int, coupon_id: int) -> Optional[UserCoupon]:
    """Toggle coupon favorite status"""
    coupon = db.query(UserCoupon).filter(
        and_(UserCoupon.id == coupon_id, UserCoupon.user_id == user_id)
    ).first()
    
    if coupon:
        coupon.is_favorite = not coupon.is_favorite
        coupon.updated_at = datetime.utcnow()
        db.commit()
        db.refresh(coupon)
    
    return coupon

def get_all_user_coupons(db: Session, user_id: int):
    """Get all coupons for a user"""
    return db.query(UserCoupon).filter(UserCoupon.user_id == user_id).all()

def save_user_coupons_batch(db: Session, user_id: int, coupons_list: list):
    """Save multiple coupons at once for a user"""
    coupon_records = []
    for coupon_data in coupons_list:
        email_id = coupon_data.get("message_id", "")
        coupon_record = UserCoupon(
            user_id=user_id,
            email_id=email_id,
            coupon_data=json.dumps(coupon_data),
            is_favorite=False
        )
        coupon_records.append(coupon_record)
    
    db.add_all(coupon_records)
    db.commit()
    return coupon_records

def delete_all_user_coupons(db: Session, user_id: int):
    """Delete all coupons for a user (for refresh)"""
    db.query(UserCoupon).filter(UserCoupon.user_id == user_id).delete()
    db.commit()
