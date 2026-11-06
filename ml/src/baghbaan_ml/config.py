"""Single source of truth for constants shared across the ML pipeline."""

from pathlib import Path

SEED = 42
IMG_SIZE = 224

# Order defines the model's output indices; the backend and mobile app rely on it.
CLASS_NAMES: tuple[str, ...] = (
    "apple_scab",
    "black_rot",
    "cedar_apple_rust",
    "healthy",
)

# PlantVillage folder / TFDS label name -> our class name.
SOURCE_LABELS: dict[str, str] = {
    "Apple___Apple_scab": "apple_scab",
    "Apple___Black_rot": "black_rot",
    "Apple___Cedar_apple_rust": "cedar_apple_rust",
    "Apple___healthy": "healthy",
}

# Stratified split fractions (train / val / test).
SPLIT_FRACTIONS: dict[str, float] = {"train": 0.70, "val": 0.15, "test": 0.15}

# Original PlantVillage repository by the dataset authors, pinned for reproducibility.
PLANTVILLAGE_GIT_URL = "https://github.com/spMohanty/PlantVillage-Dataset.git"
PLANTVILLAGE_GIT_COMMIT = "7f7ecc7e1eaca78107e3affe7cb5abd9427e139a"

ML_ROOT = Path(__file__).resolve().parents[2]
DATA_DIR = ML_ROOT / "data"
GIT_SOURCE_DIR = DATA_DIR / "plantvillage_git"
IMAGES_DIR = DATA_DIR / "apple"  # normalised: apple/<class_name>/<sha256>.jpg
MANIFEST_PATH = DATA_DIR / "manifest.csv"
MODELS_DIR = ML_ROOT / "models"
REPORTS_DIR = ML_ROOT / "reports"
