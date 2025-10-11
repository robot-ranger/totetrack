from sqlalchemy.orm import Session
import app.models as models
import app.schemas as schemas
import app.image_store as image_store
from datetime import datetime, timedelta, timezone
import secrets
from app.security import get_password_hash, verify_password, PASSWORD_RESET_TOKEN_EXPIRE_MINUTES


# Accounts


def get_account(db: Session, account_id: str) -> models.Account | None:
    return db.query(models.Account).filter(models.Account.id == account_id).first()


def get_account_by_name(db: Session, name: str) -> models.Account | None:
    return db.query(models.Account).filter(models.Account.name == name).first()


def create_account(db: Session, account: schemas.AccountCreate) -> tuple[models.Account, models.User]:
    if get_account_by_name(db, account.name):
        raise ValueError("Account name already in use")
    if get_user_by_email(db, account.owner_email):
        raise ValueError("Email already registered")

    hashed = get_password_hash(account.owner_password)
    account_model = models.Account(name=account.name)
    db.add(account_model)
    db.flush()

    owner = models.User(
        account_id=account_model.id,
        email=account.owner_email.lower(),
        full_name=account.owner_full_name,
        hashed_password=hashed,
        is_superuser=True,
        is_active=True,
    )
    db.add(owner)
    db.commit()
    db.refresh(account_model)
    db.refresh(owner)
    return account_model, owner

# Totes


def create_tote(db: Session, tote: schemas.ToteCreate, account_id: str) -> models.Tote:
    m = models.Tote(
        account_id=account_id,
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


def list_totes(db: Session, account_id: str):
    return db.query(models.Tote).filter(models.Tote.account_id == account_id).all()


def get_tote(db: Session, tote_id: str, account_id: str):
    return (
        db.query(models.Tote)
        .filter(models.Tote.id == tote_id, models.Tote.account_id == account_id)
        .first()
    )


def get_tote_by_id(db: Session, tote_id: str, account_id: str):
    return (
        db.query(models.Tote)
        .filter(models.Tote.id == tote_id, models.Tote.account_id == account_id)
        .first()
    )


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


def create_location(db: Session, location: schemas.LocationCreate, account_id: str) -> models.Location:
    m = models.Location(
        account_id=account_id,
        name=location.name,
        description=location.description,
    )
    db.add(m)
    db.commit()
    db.refresh(m)
    return m


def list_locations(db: Session, account_id: str):
    return db.query(models.Location).filter(models.Location.account_id == account_id).all()


def get_location(db: Session, location_id: str, account_id: str):
    return (
        db.query(models.Location)
        .filter(models.Location.id == location_id, models.Location.account_id == account_id)
        .first()
    )


def get_location_by_id(db: Session, location_id: str, account_id: str):
    return (
        db.query(models.Location)
        .filter(models.Location.id == location_id, models.Location.account_id == account_id)
        .first()
    )


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


def list_items(db: Session, account_id: str):
    return (
        db.query(models.Item)
        .join(models.Tote, models.Item.tote_id == models.Tote.id)
        .filter(models.Tote.account_id == account_id)
        .all()
    )


def list_items_in_tote(db: Session, tote_id: str, account_id: str):
    return (
        db.query(models.Item)
        .join(models.Tote, models.Item.tote_id == models.Tote.id)
        .filter(models.Item.tote_id == tote_id, models.Tote.account_id == account_id)
        .all()
    )


def get_item(db: Session, item_id: str, account_id: str):
    return (
        db.query(models.Item)
        .join(models.Tote, models.Item.tote_id == models.Tote.id)
        .filter(models.Item.id == item_id, models.Tote.account_id == account_id)
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


def list_users(db: Session, account_id: str):
    return db.query(models.User).filter(models.User.account_id == account_id).all()


def _account_superuser_exists(db: Session, account_id: str, exclude_user_id: str | None = None) -> bool:
    query = db.query(models.User).filter(
        models.User.account_id == account_id,
        models.User.is_superuser.is_(True),
    )
    if exclude_user_id:
        query = query.filter(models.User.id != exclude_user_id)
    return query.first() is not None


def create_user(db: Session, account_id: str, user_in: schemas.UserCreate, *, as_superuser: bool = False):
    if get_user_by_email(db, user_in.email):
        raise ValueError("Email already registered")
    if as_superuser and _account_superuser_exists(db, account_id):
        raise ValueError("Account already has a superuser")

    hashed = get_password_hash(user_in.password)
    user = models.User(
        account_id=account_id,
        email=user_in.email.lower(),
        full_name=user_in.full_name,
        hashed_password=hashed,
        is_superuser=as_superuser,
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
        if user_in.is_superuser and not user.is_superuser:
            if _account_superuser_exists(db, user.account_id):
                raise ValueError("Account already has a superuser")
            user.is_superuser = True
        elif not user_in.is_superuser and user.is_superuser:
            if not _account_superuser_exists(db, user.account_id, exclude_user_id=user.id):
                raise ValueError("Account must retain at least one superuser")
            user.is_superuser = False
    user.updated_at = datetime.utcnow()
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def delete_user(db: Session, user: models.User):
    if user.is_superuser and not _account_superuser_exists(db, user.account_id, exclude_user_id=user.id):
        raise ValueError("Cannot delete the only superuser for this account")
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


# Checkout functionality

def checkout_item(db: Session, item_id: str, user: models.User) -> models.CheckedOutItem | None:
    """Check out an item to a user. Returns None if item is already checked out or doesn't exist."""
    item = get_item(db, item_id, user.account_id)
    if not item:
        return None

    # Check if already checked out
    existing_checkout = (
        db.query(models.CheckedOutItem)
        .filter(models.CheckedOutItem.item_id == item_id)
        .first()
    )
    if existing_checkout:
        return None  # Already checked out

    # Create checkout record
    checkout = models.CheckedOutItem(
        item_id=item_id,
        user_id=user.id,
        checked_out_at=datetime.utcnow()
    )
    db.add(checkout)
    db.commit()
    db.refresh(checkout)
    return checkout


def checkin_item(db: Session, item_id: str, user: models.User) -> bool:
    """Check in an item. Returns True if successful, False if not checked out or not owned by user."""
    item = get_item(db, item_id, user.account_id)
    if not item:
        return False

    # Find and delete the checkout record
    checkout = (
        db.query(models.CheckedOutItem)
        .filter(models.CheckedOutItem.item_id == item_id)
        .first()
    )
    if not checkout:
        return False  # Not checked out

    db.delete(checkout)
    db.commit()
    return True


def get_checked_out_items(db: Session, account_id: str) -> list[models.CheckedOutItem]:
    """Get all items checked out for an account."""
    return (
        db.query(models.CheckedOutItem)
        .join(models.Item, models.CheckedOutItem.item_id == models.Item.id)
        .join(models.Tote, models.Item.tote_id == models.Tote.id)
        .filter(models.Tote.account_id == account_id)
        .all()
    )


def get_item_with_checkout_status(db: Session, item_id: str, account_id: str) -> models.Item | None:
    """Get an item with its checkout information."""
    return (
        db.query(models.Item)
        .join(models.Tote, models.Item.tote_id == models.Tote.id)
        .filter(models.Item.id == item_id, models.Tote.account_id == account_id)
        .first()
    )


def get_statistics(db: Session, account_id: str) -> dict:
    """Get statistics for locations, totes, items, and checked out items."""
    locations_count = db.query(models.Location).filter(models.Location.account_id == account_id).count()
    totes_count = db.query(models.Tote).filter(models.Tote.account_id == account_id).count()
    
    # Count items in totes owned by this user
    items_count = (
        db.query(models.Item)
        .join(models.Tote, models.Item.tote_id == models.Tote.id)
        .filter(models.Tote.account_id == account_id)
        .count()
    )
    
    # Count checked out items for this user
    checked_out_items_count = (
        db.query(models.CheckedOutItem)
        .join(models.Item, models.CheckedOutItem.item_id == models.Item.id)
        .join(models.Tote, models.Item.tote_id == models.Tote.id)
        .filter(models.Tote.account_id == account_id)
        .count()
    )
    
    return {
        "locations_count": locations_count,
        "totes_count": totes_count,
        "items_count": items_count,
        "checked_out_items_count": checked_out_items_count,
    }
