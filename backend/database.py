import os
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

# Primary PostgreSQL URL, with SQLite fallback if PostgreSQL is unavailable
POSTGRES_URL = os.getenv("DATABASE_URL", "postgresql://postgres:postgres@localhost:5432/agentic_ai")
SQLITE_URL = "sqlite:///./agentic_ai.db"

def get_engine():
    try:
        engine = create_engine(POSTGRES_URL, pool_pre_ping=True)
        # Test connection
        with engine.connect() as conn:
            pass
        return engine
    except Exception as e:
        print(f"[Database] PostgreSQL connection failed ({e}). Falling back to SQLite: {SQLITE_URL}")
        return create_engine(SQLITE_URL, connect_args={"check_same_thread": False})

engine = get_engine()
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
