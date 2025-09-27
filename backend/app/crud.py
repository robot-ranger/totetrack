from sqlalchemy.orm import Session
import app.models as models
import app.schemas as schemas
import app.image_store as image_store
from datetime import datetime, timedelta, timezone
import secrets
from app.security import get_password_hash, verify_password, PASSWORD_RESET_TOKEN_EXPIRE_MINUTES

# Totes


def create_tote(db: Session, tote: schemas.ToteCreate, user_id: str) -> models.Tote:
    m = models.Tote(
        user_id=user_id,
        name=tote.name,
        location=tote.location,
        location_id=tote.location_id,
        metadata_json=tote.metadata_json,
        description=tote.description,
    )
    db.add(m)
    db.commit()
    db.refresh(m)
    return m


def list_totes(db: Session, user_id: str = None):
    if user_id is None:
        return db.query(models.Tote).all()
    return db.query(models.Tote).filter(models.Tote.user_id == user_id).all()


def get_tote(db: Session, tote_id: str, user_id: str):
    return (
        db.query(models.Tote)
        .filter(models.Tote.id == tote_id, models.Tote.user_id == user_id)
        .first()
    )


def get_tote_by_id(db: Session, tote_id: str):
    """Get tote by ID without user restriction - for read-only access"""
    return db.query(models.Tote).filter(models.Tote.id == tote_id).first()


def delete_tote(db: Session, tote: models.Tote):
    db.delete(tote)
    db.commit()


def update_tote(db: Session, tote: models.Tote, upd: schemas.ToteUpdate):
    if upd.name is not None:
        tote.name = upd.name
    if upd.location is not None:
        tote.location = upd.location
    if upd.location_id is not None:
        tote.location_id = upd.location_id
    if upd.metadata_json is not None:
        tote.metadata_json = upd.metadata_json
    if upd.description is not None:
        tote.description = upd.description
    db.add(tote)
    db.commit()
    db.refresh(tote)
    return tote

# Locations


def create_location(db: Session, location: schemas.LocationCreate, user_id: str) -> models.Location:
    m = models.Location(
        user_id=user_id,
        name=location.name,
        description=location.description,
    )
    db.add(m)
    db.commit()
    db.refresh(m)
    return m


def list_locations(db: Session, user_id: str = None):
    if user_id is None:
        return db.query(models.Location).all()
    return db.query(models.Location).filter(models.Location.user_id == user_id).all()


def get_location(db: Session, location_id: str, user_id: str):
    return (
        db.query(models.Location)
        .filter(models.Location.id == location_id, models.Location.user_id == user_id)
        .first()
    )


def get_location_by_id(db: Session, location_id: str):
    """Get location by ID without user restriction - for read-only access"""
    return db.query(models.Location).filter(models.Location.id == location_id).first()


def delete_location(db: Session, location: models.Location):
    # Remove location association from totes that reference this location
    db.query(models.Tote).filter(models.Tote.location_id == location.id).update({"location_id": None})
    db.delete(location)
    db.commit()


def update_location(db: Session, location: models.Location, upd: schemas.LocationUpdate):
    if upd.name is not None:
        location.name = upd.name
    if upd.description is not None:
        location.description = upd.description
    db.add(location)
    db.commit()
    db.refresh(location)
    return location


# Items


def add_item(db: Session, tote_id: str, item: schemas.ItemCreate, image_path: str | None = None):
    i = models.Item(
        tote_id=tote_id,
        name=item.name,
        description=item.description,
        quantity=item.quantity,
        image_path=image_path,
    )
    db.add(i)
    db.commit()
    db.refresh(i)
    return i


def list_items(db: Session, user_id: str):
    # join to filter by tote ownership
    return (
        db.query(models.Item)
        .join(models.Tote, models.Item.tote_id == models.Tote.id)
        .filter(models.Tote.user_id == user_id)
        .all()
    )


def list_all_items(db: Session):
    """List all items without user filtering - for read-only access"""
    return db.query(models.Item).all()


def list_items_in_tote(db: Session, tote_id: str, user_id: str):
    return (
        db.query(models.Item)
        .join(models.Tote, models.Item.tote_id == models.Tote.id)
        .filter(models.Item.tote_id == tote_id, models.Tote.user_id == user_id)
        .all()
    )


def list_items_in_tote_by_id(db: Session, tote_id: str):
    """List items in a tote without user filtering - for read-only access"""
    return db.query(models.Item).filter(models.Item.tote_id == tote_id).all()


def get_item(db: Session, item_id: str, user_id: str):
    return (
        db.query(models.Item)
        .join(models.Tote, models.Item.tote_id == models.Tote.id)
        .filter(models.Item.id == item_id, models.Tote.user_id == user_id)
        .first()
    )


def update_item(db: Session, item: models.Item, upd: schemas.ItemUpdate, image_path: str | None = None):
    # Only overwrite provided (non-None) fields
    if upd.name is not None:
        item.name = upd.name
    if upd.description is not None:
        item.description = upd.description
    if upd.quantity is not None:
        item.quantity = upd.quantity
    if image_path is not None:
        # delete old image if present and different
        if item.image_path and item.image_path != image_path:
            image_store.delete_image(item.image_path)
        item.image_path = image_path
    db.add(item)
    db.commit()
    db.refresh(item)
    return item


def delete_item(db: Session, item: models.Item):
    # delete associated image file if any
    if item.image_path:
        image_store.delete_image(item.image_path)
    db.delete(item)
    db.commit()


# Users


def get_user(db: Session, user_id: str):
    return db.query(models.User).filter(models.User.id == user_id).first()


def get_user_by_email(db: Session, email: str):
    return db.query(models.User).filter(models.User.email == email.lower()).first()


def list_users(db: Session):
    return db.query(models.User).all()


def create_user(db: Session, user_in: schemas.UserCreate):
    hashed = get_password_hash(user_in.password)
    user = models.User(
        email=user_in.email.lower(),
        full_name=user_in.full_name,
        hashed_password=hashed,
        is_superuser=user_in.is_superuser,
        is_active=True,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def update_user(db: Session, user: models.User, user_in: schemas.UserUpdate):
    if user_in.full_name is not None:
        user.full_name = user_in.full_name
    if user_in.password is not None:
        user.hashed_password = get_password_hash(user_in.password)
    if user_in.is_active is not None:
        user.is_active = user_in.is_active
    if user_in.is_superuser is not None:
        user.is_superuser = user_in.is_superuser
    user.updated_at = datetime.utcnow()
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def delete_user(db: Session, user: models.User):
    db.delete(user)
    db.commit()


def update_user_password(db: Session, user: models.User, new_password: str):
    user.hashed_password = get_password_hash(new_password)
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def authenticate_user(db: Session, email: str, password: str):
    user = get_user_by_email(db, email)
    if not user:
        return None
    if not verify_password(password, user.hashed_password):
        return None
    return user


def set_reset_token(db: Session, user: models.User):
    token_plain = secrets.token_urlsafe(32)
    # store hash for security, simple approach: hash using password hasher
    token_hash = get_password_hash(token_plain)
    user.reset_token_hash = token_hash
    user.reset_token_expires = datetime.now(timezone.utc) + timedelta(minutes=PASSWORD_RESET_TOKEN_EXPIRE_MINUTES)
    db.add(user)
    db.commit()
    db.refresh(user)
    return token_plain  # return plain so it can be emailed/displayed


def consume_reset_token(db: Session, token: str, new_password: str):
    # naive scan (OK for small user base); for large scale use a separate table or deterministic hash
    now = datetime.now(timezone.utc)
    for user in db.query(models.User).filter(models.User.reset_token_hash.isnot(None)):
        if user.reset_token_expires and user.reset_token_expires < now:
            continue
        # verify provided token against stored hash
        if verify_password(token, user.reset_token_hash):
            user.reset_token_hash = None
            user.reset_token_expires = None
            update_user_password(db, user, new_password)
            return user
    return None
