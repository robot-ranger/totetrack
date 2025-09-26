from pathlib import Path
from typing import BinaryIO
from PIL import Image

MEDIA_DIR = Path("media")
MEDIA_DIR.mkdir(exist_ok=True)


def save_image(file: BinaryIO, dest_name: str) -> str:
    """Save image file"""
    path = MEDIA_DIR / dest_name
    with open(path, "wb") as f:
        f.write(file.read())
    # sanity‑check the image
    try:
        img = Image.open(path)
        img.verify()
    except Exception:
        path.unlink(missing_ok=True)
        raise
    return str(path)


def delete_image(image_path: str | None) -> None:
    """Delete an image file if it exists. Accepts absolute or stored path.

    The database stores paths like "media/<filename>". To be safe, always
    resolve to MEDIA_DIR and only delete files within it.
    """
    if not image_path:
        return
    p = Path(image_path)
    # Normalize to a file under MEDIA_DIR using just the basename
    target = MEDIA_DIR / p.name
    try:
        if target.is_file():
            target.unlink(missing_ok=True)
    except Exception:
        # Best-effort cleanup: ignore errors to avoid breaking API flows
        pass
