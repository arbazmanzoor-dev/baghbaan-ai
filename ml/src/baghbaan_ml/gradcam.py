"""Grad-CAM: where in the leaf did the model look?

Only TensorFlow and NumPy are needed so the same code runs in the backend without the training
dependencies. Reference: Selvaraju et al., "Grad-CAM", ICCV 2017.
"""

from __future__ import annotations

import keras
import numpy as np
import tensorflow as tf
from scipy import ndimage

from baghbaan_ml.model import GRADCAM_LAYER


def make_gradcam_model(model: keras.Model, layer_name: str = GRADCAM_LAYER) -> keras.Model:
    """Model mapping an image to (conv feature maps, class probabilities). Build once, reuse."""
    return keras.Model(model.inputs, [model.get_layer(layer_name).output, model.output])


def gradcam(
    grad_model: keras.Model, image: np.ndarray, class_index: int | None = None
) -> tuple[np.ndarray, np.ndarray]:
    """Return (heatmap in [0, 1] at image resolution, class probabilities).

    image: float/uint8 RGB array (H, W, 3) in [0, 255], already at the model's input size.
    class_index: class to explain; defaults to the predicted class.
    """
    x = tf.convert_to_tensor(image[None].astype("float32"))
    with tf.GradientTape() as tape:
        features, probs = grad_model(x, training=False)
        idx = int(tf.argmax(probs[0])) if class_index is None else class_index
        score = probs[:, idx]
    grads = tape.gradient(score, features)
    channel_weights = tf.reduce_mean(grads, axis=(1, 2))  # global-average-pooled gradients
    cam = tf.nn.relu(tf.reduce_sum(features * channel_weights[:, None, None, :], axis=-1))[0]
    cam = cam / (tf.reduce_max(cam) + 1e-8)
    cam = tf.image.resize(cam[..., None], image.shape[:2], method="bilinear")[..., 0]
    return cam.numpy(), probs[0].numpy()


def jet_colormap(heatmap: np.ndarray) -> np.ndarray:
    """Map [0, 1] -> RGB uint8 with the classic 'jet' palette (blue = cold, red = hot)."""
    h = np.clip(heatmap, 0.0, 1.0)[..., None]
    r = np.clip(1.5 - np.abs(4 * h - 3), 0, 1)
    g = np.clip(1.5 - np.abs(4 * h - 2), 0, 1)
    b = np.clip(1.5 - np.abs(4 * h - 1), 0, 1)
    return (np.concatenate([r, g, b], axis=-1) * 255).astype(np.uint8)


def overlay(image: np.ndarray, heatmap: np.ndarray, alpha: float = 0.45) -> np.ndarray:
    """Blend the coloured heatmap onto the photo; returns uint8 RGB of the same size."""
    colour = jet_colormap(heatmap).astype(np.float32)
    blended = (1 - alpha) * image.astype(np.float32) + alpha * colour
    return np.clip(blended, 0, 255).astype(np.uint8)


def leaf_mask(image: np.ndarray) -> np.ndarray:
    """Rough leaf segmentation for PlantVillage photos (leaf on a plain grey/purple backdrop).

    Excess-green picks the leaf blade; hole filling adds back brown/orange lesions inside it.
    Used only to audit Grad-CAM, not for inference.
    """
    rgb = image.astype(np.float32)
    exg = 2 * rgb[..., 1] - rgb[..., 0] - rgb[..., 2]
    mask = ndimage.binary_closing(exg > 20, iterations=3)
    mask = ndimage.binary_fill_holes(mask)
    labels, n = ndimage.label(mask)
    if n > 1:  # keep the largest component (the leaf)
        sizes = ndimage.sum(mask, labels, range(1, n + 1))
        mask = labels == (int(np.argmax(sizes)) + 1)
    return mask


def leaf_focus(heatmap: np.ndarray, mask: np.ndarray) -> float:
    """Share of Grad-CAM activation that falls on the leaf (1.0 = entirely on the leaf)."""
    total = float(heatmap.sum())
    return float((heatmap * mask).sum() / total) if total > 0 else 0.0
