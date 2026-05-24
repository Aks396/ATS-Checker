import os
import sys

# Append the parent directory to the path so we can import 'backend'
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from backend.app.db.session import engine, Base
from backend.app.auth.jwt import get_password_hash, verify_password

def run_tests():
    print("=== STARTING BACKEND RUNTIME VERIFICATION ===")
    
    # 1. Test Database Schema Creation
    try:
        print("Testing database table creation...")
        Base.metadata.create_all(bind=engine)
        print("[OK] Database tables verified and created successfully.")
    except Exception as e:
        print(f"[ERROR] Database initialization error: {e}")
        return False
        
    # 2. Test Cryptography & Hashing
    try:
        print("Testing password hashing algorithms (bcrypt)...")
        test_pass = "secure_password_123"
        hashed = get_password_hash(test_pass)
        assert verify_password(test_pass, hashed) == True
        assert verify_password("wrong_password", hashed) == False
        print("[OK] Password hashing and verification verified successfully.")
    except Exception as e:
        print(f"[ERROR] Cryptography hashing error: {e}")
        return False


    print("=== BACKEND RUNTIME RUNS SUCCESSFULLY ===")
    return True

if __name__ == "__main__":
    success = run_tests()
    sys.exit(0 if success else 1)
