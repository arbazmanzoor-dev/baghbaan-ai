"""Runtime settings, read from environment variables (or backend/.env)."""

from functools import lru_cache
from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict

BACKEND_DIR = Path(__file__).resolve().parents[1]
REPO_DIR = BACKEND_DIR.parent
DEV_JWT_SECRET = "dev-only-insecure-secret-change-me"


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=BACKEND_DIR / ".env", extra="ignore")

    model_path: Path = BACKEND_DIR / "models" / "baghbaan_mobilenetv2.keras"
    metrics_path: Path = BACKEND_DIR / "models" / "metrics.json"
    diseases_path: Path = REPO_DIR / "shared" / "diseases.json"

    # Must match the training pipeline (ml/src/baghbaan_ml/config.py).
    class_names: tuple[str, ...] = ("apple_scab", "black_rot", "cedar_apple_rust", "healthy")
    img_size: int = 224
    gradcam_layer: str = "out_relu"
    heatmap_size: int = 448
    confidence_threshold: float = 0.70

    cors_origins: str = "*"  # comma-separated list
    max_upload_mb: float = 8.0
    rate_limit: str = "30/minute"  # per client IP, applies to POST /predict
    log_level: str = "INFO"

    # Accounts (optional sign-in). SQLite by default; any SQLAlchemy URL works (e.g. Postgres).
    database_url: str = f"sqlite:///{BACKEND_DIR / 'data' / 'baghbaan.db'}"
    jwt_secret: str = DEV_JWT_SECRET  # MUST be overridden in production
    jwt_expiry_days: int = 30
    auth_rate_limit: str = "10/minute"  # per client IP, applies to signup and login

    @property
    def cors_origin_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]

    @property
    def max_upload_bytes(self) -> int:
        return int(self.max_upload_mb * 1024 * 1024)


@lru_cache
def get_settings() -> Settings:
    return Settings()
