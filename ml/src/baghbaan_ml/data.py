"""tf.data input pipelines and field-photo augmentation.

Images leave this module as float32 tensors in [0, 255] of shape (224, 224, 3). Model-specific
normalisation (e.g. MobileNetV2's [-1, 1] scaling) lives inside the model itself, so the
backend and the on-device TFLite model can feed raw RGB pixels exactly as here.
"""

from __future__ import annotations

from pathlib import Path

import keras
import numpy as np
import tensorflow as tf
from sklearn.utils.class_weight import compute_class_weight

from baghbaan_ml import config
from baghbaan_ml.prepare_data import Record, read_manifest

AUTOTUNE = tf.data.AUTOTUNE


def build_augmenter(seed: int = config.SEED) -> keras.Sequential:
    """Augmentations that push clean lab photos towards handheld orchard photos.

    PlantVillage leaves are centred on a plain background under even light; farmers shoot at
    odd angles, distances and exposures, sometimes with slight motion/focus blur.
    """
    return keras.Sequential(
        [
            keras.layers.RandomFlip("horizontal_and_vertical", seed=seed),
            keras.layers.RandomRotation(0.1, fill_mode="reflect", seed=seed),  # ±36°
            keras.layers.RandomZoom((-0.2, 0.2), fill_mode="reflect", seed=seed),
            keras.layers.RandomTranslation(0.1, 0.1, fill_mode="reflect", seed=seed),
            keras.layers.RandomBrightness(0.25, value_range=(0, 255), seed=seed),
            keras.layers.RandomContrast(0.25, value_range=(0, 255), seed=seed),
            keras.layers.RandomSaturation((0.35, 0.65), value_range=(0, 255), seed=seed),
            keras.layers.RandomGaussianBlur(
                factor=0.5, kernel_size=5, sigma=(0.1, 1.2), value_range=(0, 255), seed=seed
            ),
        ],
        name="field_augmentation",
    )


def decode_image(path: tf.Tensor, img_size: int = config.IMG_SIZE) -> tf.Tensor:
    """Read a JPEG/PNG file and return a float32 (img_size, img_size, 3) tensor in [0, 255]."""
    raw = tf.io.read_file(path)
    img = tf.io.decode_image(raw, channels=3, expand_animations=False)
    img = tf.image.resize(img, (img_size, img_size), method="bilinear", antialias=True)
    img.set_shape((img_size, img_size, 3))
    return tf.cast(img, tf.float32)


def records_for(split: str, records: list[Record] | None = None) -> list[Record]:
    records = read_manifest() if records is None else records
    return [r for r in records if r.split == split]


def label_indices(records: list[Record]) -> np.ndarray:
    lookup = {name: i for i, name in enumerate(config.CLASS_NAMES)}
    return np.array([lookup[r.label] for r in records], dtype=np.int32)


def make_dataset(
    records: list[Record],
    data_dir: Path = config.DATA_DIR,
    batch_size: int = 32,
    training: bool = False,
    seed: int = config.SEED,
) -> tf.data.Dataset:
    """Batched (image, one_hot_label) dataset. Shuffles and augments only when training."""
    paths = [str(data_dir / r.path) for r in records]
    labels = tf.one_hot(label_indices(records), depth=len(config.CLASS_NAMES))

    ds = tf.data.Dataset.from_tensor_slices((paths, labels))
    if training:
        ds = ds.shuffle(len(paths), seed=seed, reshuffle_each_iteration=True)
    ds = ds.map(lambda p, y: (decode_image(p), y), num_parallel_calls=AUTOTUNE)
    if not training:
        ds = ds.cache()
    ds = ds.batch(batch_size)
    if training:
        augmenter = build_augmenter(seed)
        ds = ds.map(
            lambda x, y: (tf.clip_by_value(augmenter(x, training=True), 0.0, 255.0), y),
            num_parallel_calls=AUTOTUNE,
        )
    return ds.prefetch(AUTOTUNE)


def class_weights(records: list[Record]) -> dict[int, float]:
    """Balanced class weights ({index: weight}) for Keras `fit(class_weight=...)`."""
    y = label_indices(records)
    classes = np.arange(len(config.CLASS_NAMES))
    weights = compute_class_weight("balanced", classes=classes, y=y)
    return {int(c): float(w) for c, w in zip(classes, weights, strict=True)}
