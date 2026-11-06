"""Shared fixtures. Tests use a tiny stand-in model, so CI never needs the trained model."""

from __future__ import annotations

import json
from collections.abc import Callable, Iterator
from pathlib import Path

import keras
import numpy as np
import pytest
from fastapi.testclient import TestClient

from app.config import get_settings
from app.main import create_app

ASSETS = Path(__file__).parent / "assets"
SAMPLE_IMAGE = ASSETS / "apple_scab_sample.jpg"
REAL_MODEL = Path(__file__).parents[1] / "models" / "baghbaan_mobilenetv2.keras"


def build_stub_model(path: Path, favour_class: int | None) -> Path:
    """Model with the real one's I/O contract and Grad-CAM layer name.

    favour_class=None gives near-uniform probabilities (low confidence); an index gives
    a confident prediction for that class.
    """
    keras.utils.set_random_seed(0)
    inputs = keras.Input((224, 224, 3))
    x = keras.layers.Rescaling(1 / 127.5, offset=-1)(inputs)
    x = keras.layers.Conv2D(8, 3, strides=32, activation="relu", name="out_relu")(x)
    x = keras.layers.GlobalAveragePooling2D()(x)
    dense = keras.layers.Dense(4, activation="softmax")
    model = keras.Model(inputs, dense(x))
    kernel, bias = dense.get_weights()
    kernel[:] = 0.01 * kernel
    if favour_class is not None:
        bias[favour_class] = 8.0
    dense.set_weights([kernel, bias])
    model.save(path)
    return path


@pytest.fixture
def sample_jpeg() -> bytes:
    return SAMPLE_IMAGE.read_bytes()


@pytest.fixture
def make_client(
    tmp_path: Path, monkeypatch: pytest.MonkeyPatch
) -> Iterator[Callable[..., TestClient]]:
    """Factory: make_client(favour_class=0, model=True, **env_overrides) -> started TestClient."""
    clients: list[TestClient] = []

    def factory(favour_class: int | None = 0, model: bool | Path = True, **env: str) -> TestClient:
        metrics = tmp_path / "metrics.json"
        metrics.write_text(
            json.dumps(
                {
                    "generated_at": "2026-11-02T00:00:00+00:00",
                    "model": {"name": "stub"},
                    "test": {"accuracy": 0.5},
                    "confidence": {"threshold": 0.7},
                }
            )
        )
        if isinstance(model, Path):
            model_path = model
        elif model:
            model_path = build_stub_model(tmp_path / "stub.keras", favour_class)
        else:
            model_path = tmp_path / "missing.keras"
        monkeypatch.setenv("MODEL_PATH", str(model_path))
        monkeypatch.setenv("METRICS_PATH", str(metrics))
        monkeypatch.setenv("RATE_LIMIT", "1000/minute")
        monkeypatch.setenv("AUTH_RATE_LIMIT", "1000/minute")
        monkeypatch.setenv("DATABASE_URL", f"sqlite:///{tmp_path / 'test.db'}")
        monkeypatch.setenv("JWT_SECRET", "test-secret-with-enough-length-for-hs256")
        for key, value in env.items():
            monkeypatch.setenv(key.upper(), value)
        get_settings.cache_clear()
        client = TestClient(create_app())
        client.__enter__()  # runs the lifespan (model loading)
        clients.append(client)
        return client

    yield factory
    for client in clients:
        client.__exit__(None, None, None)
    get_settings.cache_clear()


@pytest.fixture
def client(make_client) -> TestClient:
    return make_client(favour_class=0)


def png_size(b64: str) -> tuple[int, int]:
    import base64
    import io

    from PIL import Image

    with Image.open(io.BytesIO(base64.b64decode(b64))) as img:
        assert img.format == "PNG"
        return img.size


def solid_png(width: int, height: int) -> bytes:
    import io

    from PIL import Image

    buf = io.BytesIO()
    Image.fromarray(np.full((height, width, 3), 120, np.uint8)).save(buf, "PNG")
    return buf.getvalue()
