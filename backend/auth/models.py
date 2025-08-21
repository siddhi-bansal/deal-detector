"""
Database models for authentication
"""
from sqlalchemy import Column, Integer, String, DateTime, Boolean, Text
from sqlalchemy.sql import func
from database.connection import Base

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    google_id = Column(String, unique=True, index=True, nullable=False)
    first_name = Column(String, nullable=True)
    last_name = Column(String, nullable=True)
    profile_picture = Column(String, nullable=True)
    
    # Gmail integration
    gmail_connected = Column(Boolean, default=False)
    gmail_access_token = Column(Text, nullable=True)  # Encrypted
    gmail_refresh_token = Column(Text, nullable=True)  # Encrypted
    gmail_token_expiry = Column(DateTime, nullable=True)
    
    # Timestamps
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())
    last_login = Column(DateTime, nullable=True)
    
    def __repr__(self):
        return f"<User(email='{self.email}', name='{self.first_name} {self.last_name}')>"

class UserCoupon(Base):
    __tablename__ = "user_coupons"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, nullable=False, index=True)  # Foreign key to User
    email_id = Column(String, nullable=False)  # Gmail message ID
    coupon_data = Column(Text, nullable=False)  # JSON string of coupon data
    is_favorite = Column(Boolean, default=False)
    
    # Timestamps
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())
    
    def __repr__(self):
        return f"<UserCoupon(user_id={self.user_id}, email_id='{self.email_id}')>"
