# vector-backend/migrate_auth.py
from database import engine, Base
from auth import User, UserSearch, UserFavorite

# Create new tables
Base.metadata.create_all(bind=engine)
print("✅ Authentication tables created successfully!")