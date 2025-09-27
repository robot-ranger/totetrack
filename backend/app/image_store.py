from pathlib import Path
from typing import BinaryIO
from PIL import Image
import re
import unicodedata

MEDIA_DIR = Path("media")
MEDIA_DIR.mkdir(exist_ok=True)


def sanitize_filename(name: str, max_length: int = 40) -> str:
    """
    Sanitize a string to be safe for use as a filename.
    
    This function:
    1. Normalizes unicode characters
    2. Removes or replaces unsafe characters
    3. Handles edge cases like empty strings
    4. Truncates to max_length while avoiding cutting unicode characters
    """
    if not name:
        return "item"
    
    # Normalize unicode characters (decompose accented characters)
    name = unicodedata.normalize('NFKD', name)
    
    # Remove any characters that aren't alphanumeric, spaces, hyphens, or underscores
    # This eliminates problematic characters like / \ : * ? " < > |
    name = re.sub(r'[^\w\s\-]', '', name)
    
    # Replace spaces and multiple whitespace with single underscores
    name = re.sub(r'\s+', '_', name.strip())
    
    # Remove any leading/trailing underscores or hyphens
    name = name.strip('_-')
    
    # If the name is empty after sanitization, use a default
    if not name:
        return "item"
    
    # Truncate to max_length, but try not to cut in the middle of a word
    if len(name) > max_length:
        truncated = name[:max_length]
        # Try to cut at word boundary (underscore)
        last_underscore = truncated.rfind('_')
        if last_underscore > max_length // 2:  # Only if we don't cut too much
            truncated = truncated[:last_underscore]
        name = truncated.rstrip('_-')
    
    return name or "item"


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
