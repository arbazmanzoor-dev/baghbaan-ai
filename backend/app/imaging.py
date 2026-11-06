"""Upload validation and preprocessing.

Phone photos are rarely square, so we centre-crop to a square (the camera screen's framing
guide is centred) and resize to the model input. The mobile app's offline path must match.
"""

import base64
import io

import numpy as np
from PIL import Image, ImageOps, UnidentifiedImageError

ALLOWED_CONTENT_TYPES = {"image/jpeg", "image/png", "image/webp"}
ALLOWED_FORMATS = {"JPEG", "PNG", "WEBP"}
Image.MAX_IMAGE_PIXELS = 50_000_000  # reject decompression bombs (~7000x7000)


class InvalidImageError(ValueError):
    """The upload is not a usable photo."""


def load_image(data: bytes) -> Image.Image:
    """Decode bytes into an upright RGB image, or raise InvalidImageError."""
    try:
        img = Image.open(io.BytesIO(data))
        if img.format not in ALLOWED_FORMATS:
            raise InvalidImageError(f"Unsupported image format: {img.format}")
        img.load()
    except (UnidentifiedImageError, OSError, Image.DecompressionBombError) as exc:
        raise InvalidImageError("File is not a valid JPEG, PNG or WebP image") from exc
    img = ImageOps.exif_transpose(img)  # respect phone orientation
    if min(img.size) < 32:
        raise InvalidImageError("Image is too small; take a closer photo of the leaf")
    return img.convert("RGB")


def center_square(img: Image.Image) -> Image.Image:
    side = min(img.size)
    left, top = (img.width - side) // 2, (img.height - side) // 2
    return img.crop((left, top, left + side, top + side))


def to_array(img: Image.Image, size: int) -> np.ndarray:
    """Resize a square RGB image to (size, size, 3) float32 in [0, 255]."""
    return np.asarray(img.resize((size, size), Image.Resampling.BILINEAR), dtype=np.float32)


def to_png_base64(array: np.ndarray) -> str:
    buf = io.BytesIO()
    # A 256-colour palette makes the overlay ~3x smaller with no visible loss — it matters on
    # rural mobile data.
    palette = Image.fromarray(array).quantize(
        256, method=Image.Quantize.MEDIANCUT, dither=Image.Dither.NONE
    )
    palette.save(buf, format="PNG", optimize=True)
    return base64.b64encode(buf.getvalue()).decode("ascii")
