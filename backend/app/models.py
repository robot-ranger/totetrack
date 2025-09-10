import uuid
from sqlalchemy import Column, String, Integer, ForeignKey, Text
from sqlalchemy.orm import relationship
from app.db import Base


class Tote(Base):
    __tablename__ = "totes"
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String, nullable=True)
    location = Column(String, nullable=True)
    metadata_json = Column(Text, nullable=True)  # JSON string or notes
    # physical description / size / brand
    description = Column(Text, nullable=True)

    items = relationship("Item", back_populates="tote",
                         cascade="all, delete-orphan")


class Item(Base):
    __tablename__ = "items"
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    tote_id = Column(String, ForeignKey("totes.id"), nullable=False)
    name = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    quantity = Column(Integer, nullable=False, default=1)
    image_path = Column(String, nullable=True)  # stored relative to /media

    tote = relationship("Tote", back_populates="items")
