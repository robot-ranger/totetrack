from pydantic import BaseModel, Field, EmailStr
from typing import Optional, List
from datetime import datetime


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
    id: str
    image_url: Optional[str] = None
    tote_id: Optional[str] = None

    class Config:
        from_attributes = True


class LocationBase(BaseModel):
    name: str
    description: Optional[str] = None


class LocationCreate(LocationBase):
    pass


class LocationUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None


class LocationOut(LocationBase):
    id: str
    account_id: str

    class Config:
        from_attributes = True


class ToteBase(BaseModel):
    name: Optional[str] = None
    location: Optional[str] = None  # Keep for backward compatibility
    location_id: Optional[str] = None
    metadata_json: Optional[str] = None
    description: Optional[str] = None


class ToteCreate(ToteBase):
    pass

class ToteUpdate(ToteBase):
    pass


class ToteOut(ToteBase):
    id: str = Field(description="UUID string")
    items: List[ItemOut] = []
    account_id: str | None = None
    location_obj: Optional[LocationOut] = None

    class Config:
        from_attributes = True


# Users / Auth


class UserBase(BaseModel):
    email: EmailStr
    full_name: Optional[str] = None
    is_active: bool = True
    is_superuser: bool = False
    is_verified: bool = False


class UserCreate(BaseModel):
    email: EmailStr
    full_name: Optional[str] = None
    password: str


class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    password: Optional[str] = None
    is_active: Optional[bool] = None
    is_superuser: Optional[bool] = None


class UserOut(UserBase):
    id: str
    account_id: str
    created_at: datetime | None = None
    updated_at: datetime | None = None

    class Config:
        from_attributes = True


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class TokenPayload(BaseModel):
    sub: Optional[str] = None  # user id
    exp: Optional[int] = None


class PasswordRecoveryInit(BaseModel):
    email: EmailStr


class PasswordRecoveryConfirm(BaseModel):
    token: str
    new_password: str


# Email verification schemas

class VerificationInit(BaseModel):
    user_id: str


class VerificationConfirm(BaseModel):
    token: str


class VerificationEmail(BaseModel):
    user: 'UserOut'
    verification_token: str
    email_subject: str
    email_html: str

    class Config:
        from_attributes = True


# Checkout schemas

class CheckedOutItemOut(BaseModel):
    id: str
    item_id: str
    user_id: str
    checked_out_at: datetime
    # Include related objects for convenience
    item: ItemOut
    user: UserOut

    class Config:
        from_attributes = True


class ItemWithCheckoutStatus(ItemOut):
    is_checked_out: bool = False
    checked_out_by: Optional[UserOut] = None
    checked_out_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class StatisticsOut(BaseModel):
    locations_count: int
    totes_count: int
    items_count: int
    checked_out_items_count: int

    class Config:
        from_attributes = True


class AccountBase(BaseModel):
    name: str


class AccountCreate(AccountBase):
    owner_email: EmailStr
    owner_full_name: Optional[str] = None
    owner_password: str


class AccountOut(AccountBase):
    id: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class AccountBootstrapResponse(BaseModel):
    account: AccountOut
    superuser: UserOut
