import uuid
from sqlalchemy import Column, String, Integer, ForeignKey, Text, Boolean, DateTime, UniqueConstraint
from datetime import datetime
from sqlalchemy.orm import relationship
from app.db import Base


class Account(Base):
    __tablename__ = "accounts"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String, nullable=False, unique=True, index=True)
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    updated_at = Column(DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)

    users = relationship("User", back_populates="account", cascade="all, delete-orphan")
    totes = relationship("Tote", back_populates="account", cascade="all, delete-orphan")
    locations = relationship("Location", back_populates="account", cascade="all, delete-orphan")


class Location(Base):
    __tablename__ = "locations"
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    account_id = Column(String, ForeignKey("accounts.id"), nullable=False, index=True)
    name = Column(String, nullable=False)
    description = Column(Text, nullable=True)

    account = relationship("Account", back_populates="locations")
    totes = relationship("Tote", back_populates="location_obj")


class Tote(Base):
    __tablename__ = "totes"
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    account_id = Column(String, ForeignKey("accounts.id"), nullable=False, index=True)
    name = Column(String, nullable=True)
    location = Column(String, nullable=True)  # Keep for backward compatibility
    location_id = Column(String, ForeignKey("locations.id"), nullable=True, index=True)
    metadata_json = Column(Text, nullable=True)  # JSON string or notes
    # physical description / size / brand
    description = Column(Text, nullable=True)

    items = relationship(
        "Item", back_populates="tote", cascade="all, delete-orphan"
    )

    account = relationship("Account", back_populates="totes")
    location_obj = relationship("Location", back_populates="totes")


class Item(Base):
    __tablename__ = "items"
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    # When allowing items without a tote, tote_id can be null. Scope by account_id for isolation.
    tote_id = Column(String, ForeignKey("totes.id"), nullable=True, index=True)
    account_id = Column(String, ForeignKey("accounts.id"), nullable=False, index=True)
    name = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    quantity = Column(Integer, nullable=False, default=1)
    image_path = Column(String, nullable=True)  # stored relative to /media

    tote = relationship("Tote", back_populates="items")
    # Optional: backref to account not strictly needed elsewhere
    # account = relationship("Account")
    checkout = relationship("CheckedOutItem", back_populates="item", uselist=False, cascade="all, delete-orphan")


class CheckedOutItem(Base):
    __tablename__ = "checked_out_items"
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    item_id = Column(String, ForeignKey("items.id"), nullable=False, index=True)
    user_id = Column(String, ForeignKey("users.id"), nullable=False, index=True)
    checked_out_at = Column(DateTime, nullable=False, default=datetime.utcnow)

    # Relationships
    item = relationship("Item", back_populates="checkout")
    user = relationship("User", back_populates="checked_out_items")

    # Unique constraint to prevent double checkout
    __table_args__ = (
        UniqueConstraint('item_id', name='uq_checked_out_items_item_id'),
    )


class User(Base):
    __tablename__ = "users"
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    account_id = Column(String, ForeignKey("accounts.id"), nullable=False, index=True)
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

    account = relationship("Account", back_populates="users")
    checked_out_items = relationship("CheckedOutItem", back_populates="user", cascade="all, delete-orphan")
