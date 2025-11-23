"""
Script to drop and recreate all database tables
WARNING: This will delete all existing data!
"""
from database.connection import Base, engine
from auth.models import User, UserCoupon

def reset_database():
    print("Dropping all tables...")
    Base.metadata.drop_all(bind=engine)
    print("Creating all tables...")
    Base.metadata.create_all(bind=engine)
    print("Database reset complete!")

if __name__ == "__main__":
    response = input("This will DELETE ALL DATA. Type 'yes' to continue: ")
    if response.lower() == 'yes':
        reset_database()
    else:
        print("Aborted.")
