"""Loads the Keras model once and runs prediction + Grad-CAM.

The Grad-CAM maths mirrors ml/src/baghbaan_ml/gradcam.py. It is repeated here (about 20 lines)
so the API image does not need the training dependencies.
"""

import hashlib
import logging
from dataclasses import dataclass
from pathlib import Path

import keras
import numpy as np
import tensorflow as tf
from PIL import Image

from app.imaging import center_square, to_array

log = logging.getLogger(__name__)


@dataclass
class Prediction:
    probabilities: np.ndarray  # (num_classes,)
    heatmap_overlay: np.ndarray | None  # uint8 RGB (heatmap_size, heatmap_size, 3)


def jet_colormap(heatmap: np.ndarray) -> np.ndarray:
    h = np.clip(heatmap, 0.0, 1.0)[..., None]
    rgb = [np.clip(1.5 - np.abs(4 * h - c), 0, 1) for c in (3, 2, 1)]
    return (np.concatenate(rgb, axis=-1) * 255).astype(np.uint8)


def overlay(image: np.ndarray, heatmap: np.ndarray, alpha: float = 0.45) -> np.ndarray:
    blended = (1 - alpha) * image.astype(np.float32) + alpha * jet_colormap(heatmap)
    return np.clip(blended, 0, 255).astype(np.uint8)


class ModelService:
    def __init__(self, model_path: Path, gradcam_layer: str, img_size: int, heatmap_size: int):
        self.model: keras.Model = keras.models.load_model(model_path, compile=False)
        self.grad_model = keras.Model(
            self.model.input,
            [self.model.get_layer(gradcam_layer).output, self.model.output],
        )
        self.img_size = img_size
        self.heatmap_size = heatmap_size
        self.version = hashlib.sha256(model_path.read_bytes()).hexdigest()[:12]
        self.predict(Image.new("RGB", (img_size, img_size)), with_heatmap=True)  # warm-up
        log.info("Model loaded", extra={"path": str(model_path), "model_version": self.version})

    def predict(self, img: Image.Image, with_heatmap: bool) -> Prediction:
        square = center_square(img)
        x = to_array(square, self.img_size)[None]
        if not with_heatmap:
            probs = self.model(x, training=False)[0].numpy()
            return Prediction(probs, None)

        with tf.GradientTape() as tape:
            features, probs = self.grad_model(x, training=False)
            score = probs[:, int(tf.argmax(probs[0]))]
        grads = tape.gradient(score, features)
        weights = tf.reduce_mean(grads, axis=(1, 2))
        cam = tf.nn.relu(tf.reduce_sum(features * weights[:, None, None, :], axis=-1))[0]
        cam = cam / (tf.reduce_max(cam) + 1e-8)
        size = (self.heatmap_size, self.heatmap_size)
        cam = tf.image.resize(cam[..., None], size, method="bilinear")[..., 0].numpy()
        photo = to_array(square, self.heatmap_size)
        return Prediction(probs[0].numpy(), overlay(photo, cam))
