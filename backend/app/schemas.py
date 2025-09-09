from pydantic import BaseModel, Field
from typing import Optional, List


class ItemBase(BaseModel):
    name: str
    description: Optional[str] = None
    quantity: int = 1


class ItemCreate(ItemBase):
    pass


class ItemUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    quantity: Optional[int] = None


class ItemOut(ItemBase):
    id: int
    image_url: Optional[str] = None
    tote_id: Optional[str] = None

    class Config:
        from_attributes = True


class ToteBase(BaseModel):
    name: Optional[str] = None
    location: Optional[str] = None
    metadata_json: Optional[str] = None
    description: Optional[str] = None


class ToteCreate(ToteBase):
    pass


class ToteOut(ToteBase):
    id: str = Field(description="UUID string")
    items: List[ItemOut] = []

    class Config:
        from_attributes = True
