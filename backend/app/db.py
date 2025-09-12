from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
import os

# Allow overriding via env for containerized deployments
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./totes.db")

# SQLite needs special connect args
connect_args = {"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}
engine = create_engine(DATABASE_URL, connect_args=connect_args)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_session():
    """Yield a SQLAlchemy session for FastAPI dependency injection.

    FastAPI expects a plain generator that yields the resource; decorating with
    @contextmanager wraps it in a context manager object (providing __enter__/__exit__),
    which is why the endpoint received a _GeneratorContextManager instead of Session.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
