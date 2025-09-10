from fastapi import FastAPI, Depends, UploadFile, File, HTTPException, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy.orm import Session
from typing import List

from app.db import Base, engine, get_session
import app.models as models
import app.schemas as schemas
import app.crud as crud
import app.image_store as image_store

Base.metadata.create_all(bind=engine)

app = FastAPI(title="Tote Inventory API")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Serve media files
app.mount("/media", StaticFiles(directory="media"), name="media")

# Totes


@app.post("/totes", response_model=schemas.ToteOut)
def create_tote(tote: schemas.ToteCreate, db: Session = Depends(get_session)):
    return crud.create_tote(db, tote)


@app.get("/totes", response_model=List[schemas.ToteOut])
def get_totes(db: Session = Depends(get_session)):
    return crud.list_totes(db)


@app.get("/totes/{tote_id}", response_model=schemas.ToteOut)
def get_tote(tote_id: str, db: Session = Depends(get_session)):
    m = crud.get_tote(db, tote_id)
    if not m:
        raise HTTPException(status_code=404, detail="Tote not found")
    return m


@app.delete("/totes/{tote_id}")
def delete_tote(tote_id: str, db: Session = Depends(get_session)):
    tote = crud.get_tote(db, tote_id)
    if not tote:
        raise HTTPException(status_code=404, detail="Tote not found")
    # Cleanup item images before deleting via cascade
    for it in tote.items:
        if it.image_path:
            image_store.delete_image(it.image_path)
    crud.delete_tote(db, tote)
    return {"ok": True}


@app.put("/totes/{tote_id}", response_model=schemas.ToteOut)
def update_tote(tote_id: str, tote_in: schemas.ToteUpdate, db: Session = Depends(get_session)):
    tote = crud.get_tote(db, tote_id)
    if not tote:
        raise HTTPException(status_code=404, detail="Tote not found")
    updated = crud.update_tote(db, tote, tote_in)
    return updated

# Items


@app.post("/totes/{tote_id}/items", response_model=schemas.ItemOut)
async def create_item(
    tote_id: str,
    # Explicitly declare form fields so FastAPI reads them from multipart/form-data
    name: str = Form(...),
    quantity: int = Form(1),
    description: str | None = Form(None),
    image: UploadFile | None = File(None),
    db: Session = Depends(get_session)
):
    # Validate tote exists
    tote = crud.get_tote(db, tote_id)
    if not tote:
        raise HTTPException(status_code=404, detail="Tote not found")

    image_path = None
    if image is not None:
        ext = (image.filename or "bin").split(".")[-1].lower()
        safe_name = name.replace(" ", "_")[:40]
        dest = f"tote_{tote_id}_item_{safe_name}.{ext}"
        image_path = image_store.save_image(image.file, dest)

    created = crud.add_item(db, tote_id, schemas.ItemCreate(
        name=name, description=description, quantity=quantity), image_path)
    return schemas.ItemOut.model_validate({
        "id": created.id,
        "name": created.name,
        "description": created.description,
        "quantity": created.quantity,
        "image_url": f"/media/{image_path.split('/')[-1]}" if image_path else None,
        "tote_id": tote_id,
    })


@app.get("/items", response_model=List[schemas.ItemOut])
async def all_items(db: Session = Depends(get_session)):
    rows = crud.list_items(db)
    out = []
    for r in rows:
        out.append({
            "id": r.id,
            "name": r.name,
            "description": r.description,
            "quantity": r.quantity,
            "image_url": f"/media/{r.image_path.split('/')[-1]}" if r.image_path else None,
            "tote_id": r.tote_id,
        })
    return out


@app.get("/totes/{tote_id}/items", response_model=List[schemas.ItemOut])
async def items_in_tote(tote_id: str, db: Session = Depends(get_session)):
    rows = crud.list_items_in_tote(db, tote_id)
    out = []
    for r in rows:
        out.append({
            "id": r.id,
            "name": r.name,
            "description": r.description,
            "quantity": r.quantity,
            "image_url": f"/media/{r.image_path.split('/')[-1]}" if r.image_path else None,
            "tote_id": r.tote_id,
        })
    return out


@app.put("/items/{item_id}", response_model=schemas.ItemOut)
async def update_item(
    item_id: str,
    name: str | None = Form(None),
    quantity: int | None = Form(None),
    description: str | None = Form(None),
    image: UploadFile | None = File(None),
    db: Session = Depends(get_session)
):
    item = crud.get_item(db, item_id)
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")

    image_path = None
    if image is not None:
        ext = (image.filename or "bin").split(".")[-1].lower()
        safe_name = (name or item.name).replace(" ", "_")[:40]
        dest = f"tote_{item.tote_id}_item_{safe_name}_{item.id}.{ext}"
        image_path = image_store.save_image(image.file, dest)

    updated = crud.update_item(db, item, schemas.ItemUpdate(
        name=name,
        description=description,
        quantity=quantity
    ), image_path=image_path)

    return schemas.ItemOut.model_validate({
        "id": updated.id,
        "name": updated.name,
        "description": updated.description,
        "quantity": updated.quantity,
        "image_url": f"/media/{updated.image_path.split('/')[-1]}" if updated.image_path else None,
        "tote_id": updated.tote_id,
    })


@app.delete("/items/{item_id}")
async def delete_item(item_id: str, db: Session = Depends(get_session)):
    item = crud.get_item(db, item_id)
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    crud.delete_item(db, item)
    return {"ok": True}


@app.delete("/items/{item_id}/image", response_model=schemas.ItemOut)
async def delete_item_image(item_id: str, db: Session = Depends(get_session)):
    """Remove an item's associated image file and clear its image_path.
    Leaves the item record intact.
    """
    item = crud.get_item(db, item_id)
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    if item.image_path:
        image_store.delete_image(item.image_path)
        item.image_path = None
        db.add(item)
        db.commit()
        db.refresh(item)
    return schemas.ItemOut.model_validate({
        "id": item.id,
        "name": item.name,
        "description": item.description,
        "quantity": item.quantity,
        "image_url": None,
        "tote_id": item.tote_id,
    })
