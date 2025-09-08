#!/usr/bin/env python3
"""
Script to check the actual database schema
"""
import os
from sqlalchemy import create_engine, text, MetaData, Table
from core.config import settings

def check_database_schema():
    """Check the actual database schema"""
    try:
        # Force use of PostgreSQL URL for Railway
        pg_url = os.getenv('DATABASE_URL')
        if not pg_url:
            pg_url = "postgresql://postgres:vNPLmIWinFgzOvdlJkKGjfJFhhGVzxAa@postgres.railway.internal:5432/railway"
        
        print("Connecting to database...")
        print(f"Database URL: {pg_url}")
        
        # Create engine
        engine = create_engine(pg_url)
        
        # Check if users table exists and get its structure
        with engine.connect() as conn:
            print("\n=== Checking users table structure ===")
            
            # Get table info
            result = conn.execute(text("""
                SELECT column_name, data_type, is_nullable, column_default
                FROM information_schema.columns 
                WHERE table_name = 'users' 
                ORDER BY ordinal_position;
            """))
            
            columns = result.fetchall()
            
            if columns:
                print("Users table columns:")
                for col in columns:
                    print(f"  {col[0]}: {col[1]} {'(nullable)' if col[2] == 'YES' else '(not null)'}")
            else:
                print("Users table not found or no columns detected")
            
            # Check if there are any users
            print("\n=== Checking users data ===")
            result = conn.execute(text("SELECT COUNT(*) FROM users;"))
            count = result.fetchone()[0]
            print(f"Number of users in database: {count}")
            
            if count > 0:
                # Get sample user data (without sensitive fields)
                result = conn.execute(text("""
                    SELECT id, email, first_name, last_name, gmail_connected, created_at
                    FROM users 
                    LIMIT 3;
                """))
                users = result.fetchall()
                print("Sample users:")
                for user in users:
                    print(f"  ID: {user[0]}, Email: {user[1]}, Name: {user[2]} {user[3]}, Gmail: {user[4]}")
        
        print("\n=== Schema check complete ===")
        
    except Exception as e:
        print(f"Error checking database schema: {e}")
        print(f"Error type: {type(e).__name__}")

if __name__ == "__main__":
    check_database_schema()
