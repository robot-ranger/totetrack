import uuid
from sqlalchemy import Column, String, Integer, ForeignKey, Text, Boolean, DateTime, UniqueConstraint
from datetime import datetime
from sqlalchemy.orm import relationship
from app.db import Base


class Tote(Base):
    __tablename__ = "totes"
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, ForeignKey("users.id"), nullable=False, index=True)
    name = Column(String, nullable=True)
    location = Column(String, nullable=True)
    metadata_json = Column(Text, nullable=True)  # JSON string or notes
    # physical description / size / brand
    description = Column(Text, nullable=True)

    items = relationship(
        "Item", back_populates="tote", cascade="all, delete-orphan"
    )

    owner = relationship("User", back_populates="totes")


class Item(Base):
    __tablename__ = "items"
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    tote_id = Column(String, ForeignKey("totes.id"), nullable=False)
    name = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    quantity = Column(Integer, nullable=False, default=1)
    image_path = Column(String, nullable=True)  # stored relative to /media

    tote = relationship("Tote", back_populates="items")


class User(Base):
    __tablename__ = "users"
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    email = Column(String, nullable=False, unique=True, index=True)
    full_name = Column(String, nullable=True)
    is_active = Column(Boolean, nullable=False, default=True)
    is_superuser = Column(Boolean, nullable=False, default=False)
    hashed_password = Column(String, nullable=False)
    reset_token_hash = Column(String, nullable=True, index=True)
    reset_token_expires = Column(DateTime, nullable=True)
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    updated_at = Column(DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)

    __table_args__ = (
        UniqueConstraint('email', name='uq_users_email'),
    )

    totes = relationship("Tote", back_populates="owner", cascade="all, delete-orphan")
