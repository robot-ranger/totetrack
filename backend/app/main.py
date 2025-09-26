from fastapi import FastAPI, Depends, UploadFile, File, HTTPException, Form, status
from fastapi.security import OAuth2PasswordRequestForm
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy.orm import Session
from typing import List
import os
from app import security

from app.db import Base, engine, get_session
import app.models as models
import app.schemas as schemas
import app.crud as crud
import app.image_store as image_store

Base.metadata.create_all(bind=engine)

# Instantiate app early so decorators below work
openapi_tags = [
    {"name": "users", "description": "Authentication, user management, and password recovery."},
    {"name": "totes", "description": "CRUD operations for totes."},
    {"name": "items", "description": "CRUD operations for items, including image upload and deletion."},
]

app = FastAPI(title="Tote Inventory API", openapi_tags=openapi_tags)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Serve media files
app.mount("/media", StaticFiles(directory="media"), name="media")


@app.on_event("startup")
def init_superuser():
    from app.db import SessionLocal  # local import to avoid cycles
    email = os.getenv("INITIAL_SUPERUSER_EMAIL")
    password = os.getenv("INITIAL_SUPERUSER_PASSWORD")
    if not email or not password:
        return
    with SessionLocal() as db:
        existing = crud.get_user_by_email(db, email.lower())
        if not existing:
            crud.create_user(db, schemas.UserCreate(email=email, password=password, full_name="Admin", is_superuser=True))
            print("[startup] Created initial superuser", email)


# Auth & Users


@app.post("/auth/token", response_model=schemas.Token, tags=["users"])
def login_access_token(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_session)):
    user = crud.authenticate_user(db, form_data.username, form_data.password)
    if not user:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Incorrect email or password")
    token = security.create_access_token(user.id)
    return {"access_token": token, "token_type": "bearer"}


@app.post("/auth/logout", tags=["users"])
def logout(_: models.User = Depends(security.get_current_active_user)):
    """Stateless JWT logout endpoint.
    The frontend should simply discard the token. Provided for symmetry and potential future blacklist implementation.
    """
    return {"message": "logged out"}


@app.get("/users/me", response_model=schemas.UserOut, tags=["users"])
def read_users_me(current_user=Depends(security.get_current_active_user)):
    return current_user


@app.post("/users", response_model=schemas.UserOut, tags=["users"])
def create_user(user_in: schemas.UserCreate, db: Session = Depends(get_session), _: models.User = Depends(security.get_current_active_superuser)):
    existing = crud.get_user_by_email(db, user_in.email)
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    user = crud.create_user(db, user_in)
    return user


@app.get("/users", response_model=List[schemas.UserOut], tags=["users"])
def list_users(db: Session = Depends(get_session), _: models.User = Depends(security.get_current_active_superuser)):
    return crud.list_users(db)


@app.get("/users/{user_id}", response_model=schemas.UserOut, tags=["users"])
def get_user(user_id: str, db: Session = Depends(get_session), _: models.User = Depends(security.get_current_active_superuser)):
    user = crud.get_user(db, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user


@app.put("/users/{user_id}", response_model=schemas.UserOut, tags=["users"])
def update_user(user_id: str, user_in: schemas.UserUpdate, db: Session = Depends(get_session), _: models.User = Depends(security.get_current_active_superuser)):
    user = crud.get_user(db, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return crud.update_user(db, user, user_in)


@app.delete("/users/{user_id}", tags=["users"])
def delete_user(user_id: str, db: Session = Depends(get_session), current_user: models.User = Depends(security.get_current_active_superuser)):
    user = crud.get_user(db, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if user.id == current_user.id:
        raise HTTPException(status_code=400, detail="Cannot delete yourself")
    crud.delete_user(db, user)
    return {"ok": True}


@app.post("/password-recovery", tags=["users"])
def password_recovery_init(payload: schemas.PasswordRecoveryInit, db: Session = Depends(get_session)):
    user = crud.get_user_by_email(db, payload.email)
    if not user:
        return {"message": "If the account exists, a recovery token has been generated."}
    token_plain = crud.set_reset_token(db, user)
    return {"recovery_token": token_plain}


@app.post("/password-recovery/confirm", tags=["users"])
def password_recovery_confirm(payload: schemas.PasswordRecoveryConfirm, db: Session = Depends(get_session)):
    user = crud.consume_reset_token(db, payload.token, payload.new_password)
    if not user:
        raise HTTPException(status_code=400, detail="Invalid or expired token")
    return {"message": "Password updated"}

# Totes


@app.post("/totes", response_model=schemas.ToteOut, tags=["totes"])
def create_tote(
    tote: schemas.ToteCreate,
    db: Session = Depends(get_session),
    current_user: models.User = Depends(security.get_current_active_user),
):
    return crud.create_tote(db, tote, user_id=current_user.id)


@app.get("/totes", response_model=List[schemas.ToteOut], tags=["totes"])
def get_totes(
    db: Session = Depends(get_session),
    current_user: models.User = Depends(security.get_current_active_user),
):
    return crud.list_totes(db, user_id=current_user.id)


@app.get("/totes/{tote_id}", response_model=schemas.ToteOut, tags=["totes"])
def get_tote(
    tote_id: str,
    db: Session = Depends(get_session),
    current_user: models.User = Depends(security.get_current_active_user),
):
    m = crud.get_tote(db, tote_id, user_id=current_user.id)
    if not m:
        raise HTTPException(status_code=404, detail="Tote not found")
    return m


@app.delete("/totes/{tote_id}", tags=["totes"])
def delete_tote(
    tote_id: str,
    db: Session = Depends(get_session),
    current_user: models.User = Depends(security.get_current_active_user),
):
    tote = crud.get_tote(db, tote_id, user_id=current_user.id)
    if not tote:
        raise HTTPException(status_code=404, detail="Tote not found")
    # Cleanup item images before deleting via cascade
    for it in tote.items:
        if it.image_path:
            image_store.delete_image(it.image_path)
    crud.delete_tote(db, tote)
    return {"ok": True}


@app.put("/totes/{tote_id}", response_model=schemas.ToteOut, tags=["totes"])
def update_tote(
    tote_id: str,
    tote_in: schemas.ToteUpdate,
    db: Session = Depends(get_session),
    current_user: models.User = Depends(security.get_current_active_user),
):
    tote = crud.get_tote(db, tote_id, user_id=current_user.id)
    if not tote:
        raise HTTPException(status_code=404, detail="Tote not found")
    updated = crud.update_tote(db, tote, tote_in)
    return updated

# Items


@app.post("/totes/{tote_id}/items", response_model=schemas.ItemOut, tags=["items"])
async def create_item(
    tote_id: str,
    # Explicitly declare form fields so FastAPI reads them from multipart/form-data
    name: str = Form(...),
    quantity: int = Form(1),
    description: str | None = Form(None),
    image: UploadFile | None = File(None),
    db: Session = Depends(get_session),
    current_user: models.User = Depends(security.get_current_active_user),
):
    # Validate tote exists
    tote = crud.get_tote(db, tote_id, user_id=current_user.id)
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


@app.get("/items", response_model=List[schemas.ItemOut], tags=["items"])
async def all_items(
    db: Session = Depends(get_session),
    current_user: models.User = Depends(security.get_current_active_user),
):
    rows = crud.list_items(db, user_id=current_user.id)
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


@app.get("/totes/{tote_id}/items", response_model=List[schemas.ItemOut], tags=["items"])
async def items_in_tote(
    tote_id: str,
    db: Session = Depends(get_session),
    current_user: models.User = Depends(security.get_current_active_user),
):
    rows = crud.list_items_in_tote(db, tote_id, user_id=current_user.id)
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


@app.put("/items/{item_id}", response_model=schemas.ItemOut, tags=["items"])
async def update_item(
    item_id: str,
    name: str | None = Form(None),
    quantity: int | None = Form(None),
    description: str | None = Form(None),
    image: UploadFile | None = File(None),
    db: Session = Depends(get_session),
    current_user: models.User = Depends(security.get_current_active_user),
):
    item = crud.get_item(db, item_id, user_id=current_user.id)
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


@app.delete("/items/{item_id}", tags=["items"])
async def delete_item(
    item_id: str,
    db: Session = Depends(get_session),
    current_user: models.User = Depends(security.get_current_active_user),
):
    item = crud.get_item(db, item_id, user_id=current_user.id)
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    crud.delete_item(db, item)
    return {"ok": True}


@app.delete("/items/{item_id}/image", response_model=schemas.ItemOut, tags=["items"])
async def delete_item_image(
    item_id: str,
    db: Session = Depends(get_session),
    current_user: models.User = Depends(security.get_current_active_user),
):
    """Remove an item's associated image file and clear its image_path.
    Leaves the item record intact.
    """
    item = crud.get_item(db, item_id, user_id=current_user.id)
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
