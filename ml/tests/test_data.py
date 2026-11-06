"""Unit tests for the data pipeline. Use synthetic images only — no dataset download needed."""

from __future__ import annotations

import io
from collections import Counter
from pathlib import Path

import numpy as np
import pytest
from PIL import Image

from baghbaan_ml import config
from baghbaan_ml.data import build_augmenter, class_weights, make_dataset
from baghbaan_ml.prepare_data import (
    clean_and_store,
    read_manifest,
    stratified_split,
    write_manifest,
)

PER_CLASS = {"apple_scab": 40, "black_rot": 40, "cedar_apple_rust": 20, "healthy": 100}


def jpeg_bytes(seed: int, size: int = 64) -> bytes:
    rng = np.random.default_rng(seed)
    buf = io.BytesIO()
    Image.fromarray(rng.integers(0, 255, (size, size, 3), dtype=np.uint8)).save(buf, "JPEG")
    return buf.getvalue()


@pytest.fixture
def samples() -> list[tuple[str, bytes]]:
    out, seed = [], 0
    for label, n in PER_CLASS.items():
        for _ in range(n):
            out.append((label, jpeg_bytes(seed)))
            seed += 1
    return out


def test_clean_drops_corrupt_duplicates_and_label_conflicts(tmp_path: Path, samples) -> None:
    dup = samples[0]
    conflict = ("healthy", samples[1][1])  # same bytes as an apple_scab image
    records, stats = clean_and_store(
        [*samples, dup, ("black_rot", b"not an image"), conflict], tmp_path / "apple"
    )
    assert stats["corrupt"] == 1
    assert stats["duplicate"] == 2
    assert stats["label_conflict"] == 1
    assert len(records) == len(samples) - 1
    assert all((tmp_path / r.path).exists() for r in records)


def test_split_is_stratified_disjoint_and_deterministic(tmp_path: Path, samples) -> None:
    records, _ = clean_and_store(samples, tmp_path / "apple")
    first, second = stratified_split(records), stratified_split(list(reversed(records)))
    assert first == second

    by_split = {s: [r for r in first if r.split == s] for s in config.SPLIT_FRACTIONS}
    hashes = [{r.sha256 for r in rs} for rs in by_split.values()]
    assert not (hashes[0] & hashes[1] or hashes[0] & hashes[2] or hashes[1] & hashes[2])

    total = len(first)
    for split, frac in config.SPLIT_FRACTIONS.items():
        assert abs(len(by_split[split]) / total - frac) < 0.02
        counts = Counter(r.label for r in by_split[split])
        for label, n in PER_CLASS.items():
            assert abs(counts[label] / len(by_split[split]) - n / total) < 0.03


def test_manifest_round_trip(tmp_path: Path, samples) -> None:
    records = stratified_split(clean_and_store(samples, tmp_path / "apple")[0])
    write_manifest(records, tmp_path / "manifest.csv")
    assert read_manifest(tmp_path / "manifest.csv") == records


def test_dataset_shapes_and_range(tmp_path: Path, samples) -> None:
    records = stratified_split(clean_and_store(samples, tmp_path / "apple")[0])
    train = [r for r in records if r.split == "train"]
    for training in (False, True):
        x, y = next(iter(make_dataset(train, tmp_path, batch_size=8, training=training)))
        assert x.shape == (8, config.IMG_SIZE, config.IMG_SIZE, 3)
        assert y.shape == (8, len(config.CLASS_NAMES))
        assert float(x.numpy().min()) >= 0.0 and float(x.numpy().max()) <= 255.0


def test_augmenter_preserves_shape() -> None:
    x = np.full((2, config.IMG_SIZE, config.IMG_SIZE, 3), 128.0, dtype=np.float32)
    assert tuple(build_augmenter()(x, training=True).shape) == x.shape


def test_class_weights_upweight_minority(tmp_path: Path, samples) -> None:
    records = clean_and_store(samples, tmp_path / "apple")[0]
    weights = class_weights(records)
    idx = {name: i for i, name in enumerate(config.CLASS_NAMES)}
    assert weights[idx["cedar_apple_rust"]] > weights[idx["apple_scab"]] > weights[idx["healthy"]]
