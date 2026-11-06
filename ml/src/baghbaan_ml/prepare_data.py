"""Collect PlantVillage apple images, clean them and write a stratified split manifest.

Usage:
    uv run python -m baghbaan_ml.prepare_data --source git    # default, ~51 MB
    uv run python -m baghbaan_ml.prepare_data --source tfds   # 868 MB TFDS download

Output:
    data/apple/<class>/<sha256>.jpg   de-duplicated, verified JPEGs
    data/manifest.csv                 path,label,split,sha256 (paths relative to data/)
"""

from __future__ import annotations

import argparse
import csv
import hashlib
import io
import logging
import subprocess
from collections import Counter
from collections.abc import Iterable, Iterator
from dataclasses import dataclass
from pathlib import Path

from PIL import Image
from sklearn.model_selection import train_test_split

from baghbaan_ml import config

log = logging.getLogger(__name__)


@dataclass(frozen=True)
class Record:
    """One cleaned image in the manifest."""

    path: str  # relative to the data directory
    label: str
    sha256: str
    split: str = ""


# --------------------------------------------------------------------------- sources


def fetch_git_source(dest: Path = config.GIT_SOURCE_DIR) -> Path:
    """Sparse-clone only the apple folders of the pinned PlantVillage commit (~51 MB)."""
    if not dest.exists():
        subprocess.run(
            [
                "git",
                "clone",
                "--filter=blob:none",
                "--no-checkout",
                "--sparse",
                config.PLANTVILLAGE_GIT_URL,
                str(dest),
            ],
            check=True,
        )
        subprocess.run(
            [
                "git",
                "-C",
                str(dest),
                "sparse-checkout",
                "set",
                "--no-cone",
                "raw/color/Apple___*/*",
            ],
            check=True,
        )
    subprocess.run(
        ["git", "-C", str(dest), "checkout", "--quiet", config.PLANTVILLAGE_GIT_COMMIT],
        check=True,
    )
    return dest / "raw" / "color"


def iter_folder_source(root: Path) -> Iterator[tuple[str, bytes]]:
    """Yield (class_name, jpeg_bytes) from PlantVillage-style class folders."""
    for folder, label in config.SOURCE_LABELS.items():
        for file in sorted((root / folder).glob("*")):
            if file.is_file():
                yield label, file.read_bytes()


def iter_tfds_source() -> Iterator[tuple[str, bytes]]:
    """Yield (class_name, jpeg_bytes) for apple classes from TFDS plant_village (868 MB)."""
    import tensorflow as tf
    import tensorflow_datasets as tfds

    builder = tfds.builder("plant_village")
    builder.download_and_prepare()
    names = builder.info.features["label"].names
    ds = builder.as_dataset(split="train", decoders={"image": tfds.decode.SkipDecoding()})
    for example in ds:
        name = names[int(example["label"])]
        if name in config.SOURCE_LABELS:
            yield config.SOURCE_LABELS[name], tf.get_static_value(example["image"])


# --------------------------------------------------------------------------- cleaning


def is_valid_image(data: bytes) -> bool:
    """True if the bytes decode as an RGB-convertible image."""
    try:
        with Image.open(io.BytesIO(data)) as img:
            img.verify()
        return True
    except Exception:  # any decode failure means "corrupt"
        return False


def clean_and_store(
    samples: Iterable[tuple[str, bytes]], images_dir: Path
) -> tuple[list[Record], Counter[str]]:
    """Verify, de-duplicate by content hash and write images to images_dir/<class>/.

    Exact duplicates are dropped so the same leaf can never land in two splits. A hash that
    appears under two different labels is ambiguous and is removed entirely.
    """
    stats: Counter[str] = Counter()
    by_hash: dict[str, tuple[str, bytes]] = {}
    conflicting: set[str] = set()

    for label, data in samples:
        stats["seen"] += 1
        if not is_valid_image(data):
            stats["corrupt"] += 1
            continue
        digest = hashlib.sha256(data).hexdigest()
        if digest in by_hash:
            stats["duplicate"] += 1
            if by_hash[digest][0] != label:
                conflicting.add(digest)
            continue
        by_hash[digest] = (label, data)

    stats["label_conflict"] = len(conflicting)
    records: list[Record] = []
    for digest, (label, data) in sorted(by_hash.items()):
        if digest in conflicting:
            continue
        rel = Path(images_dir.name) / label / f"{digest}.jpg"
        out = images_dir / label / f"{digest}.jpg"
        out.parent.mkdir(parents=True, exist_ok=True)
        if not out.exists():
            out.write_bytes(data)
        records.append(Record(path=rel.as_posix(), label=label, sha256=digest))
    stats["kept"] = len(records)
    return records, stats


# --------------------------------------------------------------------------- splitting


def stratified_split(records: list[Record], seed: int = config.SEED) -> list[Record]:
    """Assign train/val/test (70/15/15 by default), stratified by label, deterministic."""
    fr = config.SPLIT_FRACTIONS
    ordered = sorted(records, key=lambda r: r.sha256)
    labels = [r.label for r in ordered]
    train, rest, _, rest_labels = train_test_split(
        ordered, labels, test_size=fr["val"] + fr["test"], stratify=labels, random_state=seed
    )
    val, test = train_test_split(
        rest,
        test_size=fr["test"] / (fr["val"] + fr["test"]),
        stratify=rest_labels,
        random_state=seed,
    )
    out = [
        Record(r.path, r.label, r.sha256, split)
        for split, part in (("train", train), ("val", val), ("test", test))
        for r in part
    ]
    return sorted(out, key=lambda r: (r.split, r.label, r.sha256))


def write_manifest(records: list[Record], path: Path) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", newline="") as f:
        writer = csv.writer(f)
        writer.writerow(["path", "label", "split", "sha256"])
        for r in records:
            writer.writerow([r.path, r.label, r.split, r.sha256])


def read_manifest(path: Path = config.MANIFEST_PATH) -> list[Record]:
    with path.open(newline="") as f:
        return [
            Record(row["path"], row["label"], row["sha256"], row["split"])
            for row in csv.DictReader(f)
        ]


# --------------------------------------------------------------------------- CLI


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument("--source", choices=("git", "tfds"), default="git")
    args = parser.parse_args()
    logging.basicConfig(level=logging.INFO, format="%(levelname)s %(message)s")

    samples = iter_folder_source(fetch_git_source()) if args.source == "git" else iter_tfds_source()
    records, stats = clean_and_store(samples, config.IMAGES_DIR)
    records = stratified_split(records)
    write_manifest(records, config.MANIFEST_PATH)

    log.info("Cleaning: %s", dict(stats))
    counts = Counter((r.split, r.label) for r in records)
    for split in config.SPLIT_FRACTIONS:
        log.info("%-5s %s", split, {c: counts[(split, c)] for c in config.CLASS_NAMES})
    log.info("Manifest written to %s", config.MANIFEST_PATH)


if __name__ == "__main__":
    main()
