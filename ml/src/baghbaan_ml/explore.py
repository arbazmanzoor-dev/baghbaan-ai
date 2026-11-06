"""Dataset exploration: class balance, image statistics, sample and augmentation grids.

Usage:
    uv run python -m baghbaan_ml.explore

Writes to reports/data/:
    class_distribution.png, sample_grid.png, augmentation_preview.png, dataset_summary.json
"""

from __future__ import annotations

import json
from collections import Counter
from pathlib import Path

import matplotlib

matplotlib.use("Agg")

import matplotlib.pyplot as plt
import numpy as np
import tensorflow as tf
from PIL import Image

from baghbaan_ml import config
from baghbaan_ml.data import build_augmenter, decode_image
from baghbaan_ml.prepare_data import Record, read_manifest

OUT_DIR = config.REPORTS_DIR / "data"
PRETTY = {
    "apple_scab": "Apple Scab",
    "black_rot": "Black Rot",
    "cedar_apple_rust": "Cedar Apple Rust",
    "healthy": "Healthy",
}
SPLITS = tuple(config.SPLIT_FRACTIONS)


def image_stats(records: list[Record], data_dir: Path) -> dict[str, dict[str, object]]:
    """Per-class image sizes plus mean brightness and green-channel dominance."""
    out: dict[str, dict[str, object]] = {}
    for label in config.CLASS_NAMES:
        sizes: Counter[str] = Counter()
        brightness, green = [], []
        for r in (r for r in records if r.label == label):
            with Image.open(data_dir / r.path) as img:
                sizes[f"{img.width}x{img.height}"] += 1
                arr = np.asarray(img.convert("RGB"), dtype=np.float32)
            brightness.append(arr.mean())
            green.append(arr[..., 1].mean() - arr[..., [0, 2]].mean())
        out[label] = {
            "sizes": dict(sizes),
            "mean_brightness": round(float(np.mean(brightness)), 1),
            "std_brightness": round(float(np.std(brightness)), 1),
            "mean_green_excess": round(float(np.mean(green)), 1),
        }
    return out


def plot_distribution(records: list[Record], path: Path) -> None:
    counts = Counter((r.split, r.label) for r in records)
    x = np.arange(len(config.CLASS_NAMES))
    fig, ax = plt.subplots(figsize=(8, 4.5))
    bottom = np.zeros(len(x))
    for split, colour in zip(SPLITS, ("#2f5d3a", "#61de8a", "#d68910"), strict=True):
        vals = np.array([counts[(split, c)] for c in config.CLASS_NAMES])
        ax.bar(x, vals, bottom=bottom, label=split, color=colour)
        bottom += vals
    for xi, total in zip(x, bottom, strict=True):
        ax.text(xi, total + 15, f"{int(total)}", ha="center", fontsize=10)
    ax.set_xticks(x, [PRETTY[c] for c in config.CLASS_NAMES])
    ax.set_ylabel("Images")
    ax.set_title("PlantVillage apple images per class and split")
    ax.legend(frameon=False)
    ax.spines[["top", "right"]].set_visible(False)
    fig.tight_layout()
    fig.savefig(path, dpi=150)
    plt.close(fig)


def plot_samples(records: list[Record], data_dir: Path, path: Path, per_class: int = 6) -> None:
    rng = np.random.default_rng(config.SEED)
    fig, axes = plt.subplots(len(config.CLASS_NAMES), per_class, figsize=(per_class * 1.8, 8))
    for row, label in enumerate(config.CLASS_NAMES):
        pool = [r for r in records if r.label == label]
        for col, idx in enumerate(rng.choice(len(pool), per_class, replace=False)):
            ax = axes[row, col]
            ax.imshow(Image.open(data_dir / pool[idx].path))
            ax.axis("off")
        axes[row, 0].set_title(PRETTY[label], loc="left", fontsize=10)
    fig.suptitle("Random samples (train split)")
    fig.tight_layout()
    fig.savefig(path, dpi=120)
    plt.close(fig)


def plot_augmentations(record: Record, data_dir: Path, path: Path, n: int = 8) -> None:
    img = decode_image(tf.constant(str(data_dir / record.path)))
    batch = tf.repeat(img[None], n, axis=0)
    aug = tf.clip_by_value(build_augmenter()(batch, training=True), 0, 255).numpy()
    fig, axes = plt.subplots(1, n + 1, figsize=((n + 1) * 1.8, 2.2))
    axes[0].imshow(img.numpy().astype("uint8"))
    axes[0].set_title("original", fontsize=9)
    for ax, a in zip(axes[1:], aug, strict=True):
        ax.imshow(a.astype("uint8"))
    for ax in axes:
        ax.axis("off")
    fig.tight_layout()
    fig.savefig(path, dpi=120)
    plt.close(fig)


def main() -> None:
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    tf.keras.utils.set_random_seed(config.SEED)
    records = read_manifest()
    train = [r for r in records if r.split == "train"]

    plot_distribution(records, OUT_DIR / "class_distribution.png")
    plot_samples(train, config.DATA_DIR, OUT_DIR / "sample_grid.png")
    scab = next(r for r in train if r.label == "apple_scab")
    plot_augmentations(scab, config.DATA_DIR, OUT_DIR / "augmentation_preview.png")

    counts = Counter(r.label for r in records)
    summary = {
        "total_images": len(records),
        "per_split": {s: sum(r.split == s for r in records) for s in SPLITS},
        "per_class": {c: counts[c] for c in config.CLASS_NAMES},
        "per_split_class": {
            s: {c: sum(r.split == s and r.label == c for r in records) for c in config.CLASS_NAMES}
            for s in SPLITS
        },
        "imbalance_ratio_max_over_min": round(max(counts.values()) / min(counts.values()), 2),
        "image_stats": image_stats(records, config.DATA_DIR),
        "source": {
            "repo": config.PLANTVILLAGE_GIT_URL,
            "commit": config.PLANTVILLAGE_GIT_COMMIT,
            "subset": "raw/color/Apple___*",
        },
    }
    (OUT_DIR / "dataset_summary.json").write_text(json.dumps(summary, indent=2) + "\n")
    print(json.dumps({k: v for k, v in summary.items() if k != "image_stats"}, indent=2))


if __name__ == "__main__":
    main()
