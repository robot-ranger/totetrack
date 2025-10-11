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
    {"name": "accounts", "description": "Account bootstrap and management."},
    {"name": "users", "description": "Authentication, user management, and password recovery."},
    {"name": "totes", "description": "CRUD operations for totes."},
    {"name": "items", "description": "CRUD operations for items, including image upload and deletion."},
    {"name": "locations", "description": "CRUD operations for locations."},
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
    account_name = os.getenv("INITIAL_ACCOUNT_NAME", "Default Account")
    if not email or not password:
        return
    with SessionLocal() as db:
        print("[startup] Checking for initial superuser", email)
        existing = crud.get_user_by_email(db, email.lower())
        
        print(f"[startup] found {email}" if existing else "not found")
        if not existing:
            try:
                account, owner = crud.create_account(db, schemas.AccountCreate(
                    name=account_name,
                    owner_email=email,
                    owner_full_name="Admin",
                    owner_password=password,
                ))
                print("[startup] Created initial account", account.name, "with superuser", owner.email)
            except ValueError as exc:
                print(f"[startup] Failed to create initial account: {exc}")


# Auth & Users


@app.post("/accounts", response_model=schemas.AccountBootstrapResponse, tags=["accounts"])
def bootstrap_account(payload: schemas.AccountCreate, db: Session = Depends(get_session)):
    try:
        account, superuser = crud.create_account(db, payload)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))
    return schemas.AccountBootstrapResponse(account=account, superuser=superuser)


@app.get("/accounts", response_model=List[schemas.AccountOut], tags=["accounts"])
def list_accounts(
    db: Session = Depends(get_session),
    current_user: models.User = Depends(security.get_current_active_superuser),
):
    """Return the caller's account as a list for compatibility with list UIs.

    This system enforces one account per user; there is no global account list.
    """
    acc = crud.get_account(db, current_user.account_id)
    return [acc] if acc else []


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
def create_user(
    user_in: schemas.UserCreate,
    db: Session = Depends(get_session),
    current_user: models.User = Depends(security.get_current_active_superuser),
):
    try:
        user = crud.create_user(db, current_user.account_id, user_in)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))
    return user


@app.get("/users", response_model=List[schemas.UserOut], tags=["users"])
def list_users(
    db: Session = Depends(get_session),
    current_user: models.User = Depends(security.get_current_active_superuser),
):
    return crud.list_users(db, current_user.account_id)


@app.get("/users/{user_id}", response_model=schemas.UserOut, tags=["users"])
def get_user(
    user_id: str,
    db: Session = Depends(get_session),
    current_user: models.User = Depends(security.get_current_active_superuser),
):
    user = crud.get_user(db, user_id)
    if not user or user.account_id != current_user.account_id:
        raise HTTPException(status_code=404, detail="User not found")
    return user


@app.put("/users/{user_id}", response_model=schemas.UserOut, tags=["users"])
def update_user(
    user_id: str,
    user_in: schemas.UserUpdate,
    db: Session = Depends(get_session),
    current_user: models.User = Depends(security.get_current_active_superuser),
):
    user = crud.get_user(db, user_id)
    if not user or user.account_id != current_user.account_id:
        raise HTTPException(status_code=404, detail="User not found")
    try:
        return crud.update_user(db, user, user_in)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))


@app.delete("/users/{user_id}", tags=["users"])
def delete_user(
    user_id: str,
    db: Session = Depends(get_session),
    current_user: models.User = Depends(security.get_current_active_superuser),
):
    user = crud.get_user(db, user_id)
    if not user or user.account_id != current_user.account_id:
        raise HTTPException(status_code=404, detail="User not found")
    if user.id == current_user.id:
        raise HTTPException(status_code=400, detail="Cannot delete yourself")
    try:
        crud.delete_user(db, user)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))
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
    return crud.create_tote(db, tote, account_id=current_user.account_id)


@app.get("/totes", response_model=List[schemas.ToteOut], tags=["totes"])
def get_totes(
    db: Session = Depends(get_session),
    current_user: models.User = Depends(security.get_current_active_user),
):
    return crud.list_totes(db, account_id=current_user.account_id)


@app.get("/totes/{tote_id}", response_model=schemas.ToteOut, tags=["totes"])
def get_tote(
    tote_id: str,
    db: Session = Depends(get_session),
    current_user: models.User = Depends(security.get_current_active_user),
):
    m = crud.get_tote_by_id(db, tote_id, current_user.account_id)
    if not m:
        raise HTTPException(status_code=404, detail="Tote not found")
    return m


@app.delete("/totes/{tote_id}", tags=["totes"])
def delete_tote(
    tote_id: str,
    db: Session = Depends(get_session),
    current_user: models.User = Depends(security.get_current_active_user),
):
    tote = crud.get_tote(db, tote_id, account_id=current_user.account_id)
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
    tote = crud.get_tote(db, tote_id, account_id=current_user.account_id)
    if not tote:
        raise HTTPException(status_code=404, detail="Tote not found")
    updated = crud.update_tote(db, tote, tote_in)
    return updated

# Locations


@app.post("/locations", response_model=schemas.LocationOut, tags=["locations"])
def create_location(
    location: schemas.LocationCreate,
    db: Session = Depends(get_session),
    current_user: models.User = Depends(security.get_current_active_user),
):
    return crud.create_location(db, location, account_id=current_user.account_id)


@app.get("/locations", response_model=List[schemas.LocationOut], tags=["locations"])
def get_locations(
    db: Session = Depends(get_session),
    current_user: models.User = Depends(security.get_current_active_user),
):
    return crud.list_locations(db, account_id=current_user.account_id)


@app.get("/locations/{location_id}", response_model=schemas.LocationOut, tags=["locations"])
def get_location(
    location_id: str,
    db: Session = Depends(get_session),
    current_user: models.User = Depends(security.get_current_active_user),
):
    location = crud.get_location(db, location_id, account_id=current_user.account_id)
    if not location:
        raise HTTPException(status_code=404, detail="Location not found")
    return location


@app.delete("/locations/{location_id}", tags=["locations"])
def delete_location(
    location_id: str,
    db: Session = Depends(get_session),
    current_user: models.User = Depends(security.get_current_active_user),
):
    location = crud.get_location(db, location_id, account_id=current_user.account_id)
    if not location:
        raise HTTPException(status_code=404, detail="Location not found")
    crud.delete_location(db, location)
    return {"ok": True}


@app.put("/locations/{location_id}", response_model=schemas.LocationOut, tags=["locations"])
def update_location(
    location_id: str,
    location_in: schemas.LocationUpdate,
    db: Session = Depends(get_session),
    current_user: models.User = Depends(security.get_current_active_user),
):
    location = crud.get_location(db, location_id, account_id=current_user.account_id)
    if not location:
        raise HTTPException(status_code=404, detail="Location not found")
    updated = crud.update_location(db, location, location_in)
    return updated


@app.get("/locations/{location_id}/totes", response_model=List[schemas.ToteOut], tags=["locations"])
def get_location_totes(
    location_id: str,
    db: Session = Depends(get_session),
    current_user: models.User = Depends(security.get_current_active_user),
):
    location = crud.get_location(db, location_id, account_id=current_user.account_id)
    if not location:
        raise HTTPException(status_code=404, detail="Location not found")
    return location.totes


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
    tote = crud.get_tote(db, tote_id, account_id=current_user.account_id)
    if not tote:
        raise HTTPException(status_code=404, detail="Tote not found")

    image_path = None
    if image is not None:
        ext = (image.filename or "bin").split(".")[-1].lower()
        safe_name = image_store.sanitize_filename(name)
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


@app.get("/items", response_model=List[schemas.ItemWithCheckoutStatus], tags=["items"])
async def all_items(
    db: Session = Depends(get_session),
    current_user: models.User = Depends(security.get_current_active_user),
):
    rows = crud.list_items(db, current_user.account_id)
    out = []
    for r in rows:
        checkout_info = {
            "is_checked_out": r.checkout is not None,
            "checked_out_by": None,
            "checked_out_at": None,
        }
        if r.checkout:
            checkout_info["checked_out_by"] = r.checkout.user
            checkout_info["checked_out_at"] = r.checkout.checked_out_at
        
        out.append({
            "id": r.id,
            "name": r.name,
            "description": r.description,
            "quantity": r.quantity,
            "image_url": f"/media/{r.image_path.split('/')[-1]}" if r.image_path else None,
            "tote_id": r.tote_id,
            **checkout_info,
        })
    return out


@app.get("/totes/{tote_id}/items", response_model=List[schemas.ItemOut], tags=["items"])
async def items_in_tote(
    tote_id: str,
    db: Session = Depends(get_session),
    current_user: models.User = Depends(security.get_current_active_user),
):
    rows = crud.list_items_in_tote(db, tote_id, current_user.account_id)
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
    item = crud.get_item(db, item_id, current_user.account_id)
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")

    image_path = None
    if image is not None:
        ext = (image.filename or "bin").split(".")[-1].lower()
        safe_name = image_store.sanitize_filename(name or item.name)
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
    item = crud.get_item(db, item_id, current_user.account_id)
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
    item = crud.get_item(db, item_id, current_user.account_id)
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


# Checkout functionality

@app.post("/items/{item_id}/checkout", response_model=schemas.CheckedOutItemOut, tags=["items"])
async def checkout_item(
    item_id: str,
    db: Session = Depends(get_session),
    current_user: models.User = Depends(security.get_current_active_user),
):
    """Check out an item to the current user."""
    checkout = crud.checkout_item(db, item_id, current_user)
    if not checkout:
        raise HTTPException(
            status_code=400, 
            detail="Item not found, already checked out, or access denied"
        )
    return checkout


@app.delete("/items/{item_id}/checkin", tags=["items"])
async def checkin_item(
    item_id: str,
    db: Session = Depends(get_session),
    current_user: models.User = Depends(security.get_current_active_user),
):
    """Check in an item (remove from checked out list)."""
    success = crud.checkin_item(db, item_id, current_user)
    if not success:
        raise HTTPException(
            status_code=400,
            detail="Item not found, not checked out, or access denied"
        )
    return {"message": "Item checked in successfully"}


@app.get("/checked-out-items", response_model=List[schemas.CheckedOutItemOut], tags=["items"])
async def get_checked_out_items(
    db: Session = Depends(get_session),
    current_user: models.User = Depends(security.get_current_active_user),
):
    """Get all items checked out from totes owned by the current user."""
    return crud.get_checked_out_items(db, current_user.account_id)


@app.get("/statistics", response_model=schemas.StatisticsOut, tags=["statistics"])
async def get_statistics(
    db: Session = Depends(get_session),
    current_user: models.User = Depends(security.get_current_active_user),
):
    """Get summary statistics for the current user's inventory."""
    stats = crud.get_statistics(db, current_user.account_id)
    return schemas.StatisticsOut(**stats)
