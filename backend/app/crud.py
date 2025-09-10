from sqlalchemy.orm import Session
import app.models as models
import app.schemas as schemas
import app.image_store as image_store

# Totes


def create_tote(db: Session, tote: schemas.ToteCreate) -> models.Tote:
    m = models.Tote(
        name=tote.name,
        location=tote.location,
        metadata_json=tote.metadata_json,
        description=tote.description,
    )
    db.add(m)
    db.commit()
    db.refresh(m)
    return m


def list_totes(db: Session):
    return db.query(models.Tote).all()


def get_tote(db: Session, tote_id: str):
    return db.query(models.Tote).filter(models.Tote.id == tote_id).first()


def delete_tote(db: Session, tote: models.Tote):
    db.delete(tote)
    db.commit()


def update_tote(db: Session, tote: models.Tote, upd: schemas.ToteUpdate):
    if upd.name is not None:
        tote.name = upd.name
    if upd.location is not None:
        tote.location = upd.location
    if upd.metadata_json is not None:
        tote.metadata_json = upd.metadata_json
    if upd.description is not None:
        tote.description = upd.description
    db.add(tote)
    db.commit()
    db.refresh(tote)
    return tote

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


def list_items(db: Session):
    return db.query(models.Item).all()


def list_items_in_tote(db: Session, tote_id: str):
    return db.query(models.Item).filter(models.Item.tote_id == tote_id).all()


def get_item(db: Session, item_id: str):
    return db.query(models.Item).filter(models.Item.id == item_id).first()


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
