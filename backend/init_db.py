"""
Initialize database tables
"""
from database.connection import Base, engine
from auth.models import User, UserCoupon

def create_tables():
    """Create all database tables"""
    Base.metadata.create_all(bind=engine)
    print("Database tables created successfully!")

if __name__ == "__main__":
    create_tables()
