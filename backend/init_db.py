"""
Initialize database tables
"""
from database.connection import Base, engine
from auth.models import User, UserCoupon
from sqlalchemy import inspect, text

def create_tables():
    """Create all database tables and add missing columns"""
    # Create tables if they don't exist
    Base.metadata.create_all(bind=engine)
    
    # Check if gmail columns exist in users table
    inspector = inspect(engine)
    if 'users' in inspector.get_table_names():
        columns = [col['name'] for col in inspector.get_columns('users')]
        
        # Add missing columns if they don't exist
        missing_columns = []
        if 'gmail_history_id' not in columns:
            missing_columns.append(('gmail_history_id', 'VARCHAR'))
        if 'gmail_watch_expiration' not in columns:
            missing_columns.append(('gmail_watch_expiration', 'TIMESTAMP'))
        
        if missing_columns:
            print(f"Adding missing columns: {[col[0] for col in missing_columns]}")
            with engine.connect() as conn:
                for col_name, col_type in missing_columns:
                    try:
                        conn.execute(text(f"ALTER TABLE users ADD COLUMN {col_name} {col_type}"))
                        conn.commit()
                        print(f"Added column: {col_name}")
                    except Exception as e:
                        print(f"Could not add column {col_name}: {e}")
    
    print("Database tables initialized successfully!")

if __name__ == "__main__":
    create_tables()
