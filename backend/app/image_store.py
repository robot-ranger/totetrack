from pathlib import Path
from typing import BinaryIO
from PIL import Image

MEDIA_DIR = Path("media")
MEDIA_DIR.mkdir(exist_ok=True)


def save_image(file: BinaryIO, dest_name: str) -> str:
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
