"""Model, Grad-CAM and TFLite export tests. No pretrained weights or dataset required."""

from __future__ import annotations

import keras
import numpy as np
import pytest
import tensorflow as tf

from baghbaan_ml import config
from baghbaan_ml.export import convert, run_tflite
from baghbaan_ml.gradcam import (
    gradcam,
    jet_colormap,
    leaf_focus,
    leaf_mask,
    make_gradcam_model,
    overlay,
)
from baghbaan_ml.model import GRADCAM_LAYER, build_model, set_backbone_trainable

SIZE = config.IMG_SIZE


@pytest.fixture(scope="module")
def model() -> keras.Model:
    keras.utils.set_random_seed(config.SEED)
    return build_model(weights=None)


def leaf_image() -> np.ndarray:
    """Synthetic 'leaf': green ellipse with a brown lesion on a grey backdrop."""
    img = np.full((SIZE, SIZE, 3), 130, dtype=np.uint8)
    yy, xx = np.mgrid[:SIZE, :SIZE]
    leaf = ((yy - 112) / 90) ** 2 + ((xx - 112) / 60) ** 2 < 1
    img[leaf] = (40, 140, 50)
    img[((yy - 100) ** 2 + (xx - 110) ** 2) < 100] = (120, 80, 40)
    return img


def test_model_io_and_phases(model: keras.Model) -> None:
    probs = model(np.zeros((2, SIZE, SIZE, 3), np.float32), training=False).numpy()
    assert probs.shape == (2, len(config.CLASS_NAMES))
    np.testing.assert_allclose(probs.sum(axis=1), 1.0, rtol=1e-5)
    assert model.get_layer(GRADCAM_LAYER).output.shape[1:3] == (7, 7)

    set_backbone_trainable(model, fine_tune=False)
    frozen = len(model.trainable_weights)
    set_backbone_trainable(model, fine_tune=True)
    assert len(model.trainable_weights) > frozen
    assert not any(
        layer.trainable
        for layer in model.layers
        if isinstance(layer, keras.layers.BatchNormalization)
    )
    set_backbone_trainable(model, fine_tune=False)


def test_gradcam_heatmap(model: keras.Model) -> None:
    heat, probs = gradcam(make_gradcam_model(model), leaf_image().astype(np.float32))
    assert heat.shape == (SIZE, SIZE)
    assert heat.min() >= 0.0 and heat.max() <= 1.0 + 1e-6
    assert probs.shape == (len(config.CLASS_NAMES),)


def test_overlay_and_colormap() -> None:
    img = leaf_image()
    heat = np.linspace(0, 1, SIZE * SIZE).reshape(SIZE, SIZE)
    out = overlay(img, heat)
    assert out.shape == img.shape and out.dtype == np.uint8
    cold, hot = jet_colormap(np.array([0.0, 1.0]))
    assert cold[2] > cold[0] and hot[0] > hot[2]  # blue when cold, red when hot


def test_leaf_mask_and_focus() -> None:
    mask = leaf_mask(leaf_image())
    assert mask[112, 112] and mask[100, 110]  # leaf centre and the lesion inside it
    assert not mask[5, 5]  # backdrop corner
    assert leaf_focus(mask.astype(float), mask) == pytest.approx(1.0)
    assert leaf_focus((~mask).astype(float), mask) == pytest.approx(0.0)


def test_int8_export_round_trip() -> None:
    """Full-integer conversion of a tiny model: uint8 input, valid probabilities out."""
    inputs = keras.Input((32, 32, 3))
    x = keras.layers.Rescaling(1 / 127.5, offset=-1)(inputs)
    x = keras.layers.Conv2D(4, 3, activation="relu")(x)
    x = keras.layers.GlobalAveragePooling2D()(x)
    tiny = keras.Model(inputs, keras.layers.Dense(4, activation="softmax")(x))
    rng = np.random.default_rng(0)
    images = rng.uniform(0, 255, (8, 32, 32, 3)).astype(np.float32)
    calib = tf.data.Dataset.from_tensor_slices((images, np.zeros(8))).batch(1)

    probs, _, details = run_tflite(convert(tiny, "int8", calib), images)
    assert details["dtype"] == "uint8"
    assert probs.shape == (8, 4)
    np.testing.assert_allclose(probs.sum(axis=1), 1.0, atol=0.02)

    with pytest.raises(ValueError):
        convert(tiny, "int8")
