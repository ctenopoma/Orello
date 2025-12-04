import os
import sys
from pathlib import Path

from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker


# Determine the database path based on environment
def get_database_path():
    # Check if running as PyInstaller bundle
    if getattr(sys, 'frozen', False):
        # Running as compiled executable
        # Use AppData/Roaming on Windows, ~/.local/share on Linux, ~/Library/Application Support on Mac
        if os.name == 'nt':  # Windows
            app_data = os.getenv('APPDATA')
            db_dir = Path(app_data) / 'Orello'
        else:
            home = Path.home()
            db_dir = home / '.orello'
        
        # Create directory if it doesn't exist
        db_dir.mkdir(parents=True, exist_ok=True)
        return db_dir / 'database.db'
    else:
        # Running in development mode
        return Path('./database.db')

db_path = get_database_path()
SQLALCHEMY_DATABASE_URL = f"sqlite:///{db_path}"

# check_same_thread=False is needed for SQLite with FastAPI
engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
