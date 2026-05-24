import os
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv

load_dotenv()

# Default to SQLite for easy local setup, support MySQL out of the box
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./ats_analyzer.db")

# Automatically inject pymysql adapter for MySQL connection strings if not present
if DATABASE_URL.startswith("mysql://"):
    DATABASE_URL = DATABASE_URL.replace("mysql://", "mysql+pymysql://")

# Auto-create MySQL database if it doesn't exist
if "mysql" in DATABASE_URL:
    try:
        import pymysql
        # Parse connection string
        # mysql+pymysql://user:pass@host:port/dbname
        main_part = DATABASE_URL.split("://")[1]
        creds, host_part = main_part.split("@")
        user = creds.split(":")[0]
        password = creds.split(":")[1] if ":" in creds else ""
        
        host_port, db_name = host_part.split("/")
        if "?" in db_name:
            db_name = db_name.split("?")[0]
            
        host = host_port.split(":")[0]
        port = int(host_port.split(":")[1]) if ":" in host_port else 3306
        
        # Connect to MySQL server to ensure DB exists
        conn = pymysql.connect(host=host, port=port, user=user, password=password)
        cursor = conn.cursor()
        cursor.execute(f"CREATE DATABASE IF NOT EXISTS {db_name}")
        cursor.close()
        conn.close()
        print(f"MySQL Database '{db_name}' verified/created.")
    except Exception as db_err:
        print(f"WARNING: Could not auto-create MySQL database: {db_err}")

connect_args = {}
if DATABASE_URL.startswith("sqlite"):
    connect_args = {"check_same_thread": False}

engine = create_engine(
    DATABASE_URL, 
    pool_pre_ping=True, 
    connect_args=connect_args
)


SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
