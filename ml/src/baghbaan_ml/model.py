"""MobileNetV2 transfer-learning classifier.

The backbone is built on the model's own input tensor so its layers live in one flat functional
graph. That keeps Grad-CAM simple (`model.get_layer(GRADCAM_LAYER)`) and the export clean.

Input: float32 RGB in [0, 255], shape (224, 224, 3). Scaling to MobileNetV2's [-1, 1] happens
inside the model, so every consumer (backend, TFLite on the phone) feeds raw pixels.
"""

from __future__ import annotations

import keras

from baghbaan_ml import config

BACKBONE_PREFIX = "mobilenetv2"
GRADCAM_LAYER = "out_relu"  # last conv activation of MobileNetV2 (7x7x1280)
# Fine-tuning unfreezes MobileNetV2 from this block onwards (blocks 13–16 + final conv).
FINE_TUNE_FROM = "block_13_expand"


def build_model(dropout: float = 0.25, weights: str | None = "imagenet") -> keras.Model:
    inputs = keras.Input((config.IMG_SIZE, config.IMG_SIZE, 3), name="image")
    x = keras.layers.Rescaling(1.0 / 127.5, offset=-1.0, name="to_minus1_1")(inputs)
    backbone = keras.applications.MobileNetV2(
        input_tensor=x,
        input_shape=(config.IMG_SIZE, config.IMG_SIZE, 3),
        include_top=False,
        weights=weights,
        alpha=1.0,
    )
    x = keras.layers.GlobalAveragePooling2D(name="gap")(backbone.output)
    x = keras.layers.Dropout(dropout, name="dropout")(x)
    outputs = keras.layers.Dense(len(config.CLASS_NAMES), activation="softmax", name="probs")(x)
    model = keras.Model(inputs, outputs, name="baghbaan_mobilenetv2")
    set_backbone_trainable(model, fine_tune=False)
    return model


def _backbone_layers(model: keras.Model) -> list[keras.layers.Layer]:
    head = {"image", "to_minus1_1", "gap", "dropout", "probs"}
    return [layer for layer in model.layers if layer.name not in head]


def set_backbone_trainable(model: keras.Model, fine_tune: bool) -> None:
    """Phase 1: whole backbone frozen. Phase 2: unfreeze from FINE_TUNE_FROM onwards.

    BatchNormalization layers stay frozen in both phases: with small batches their running
    statistics would drift away from ImageNet's and hurt accuracy.
    """
    unfrozen = False
    for layer in _backbone_layers(model):
        if layer.name == FINE_TUNE_FROM:
            unfrozen = fine_tune
        is_bn = isinstance(layer, keras.layers.BatchNormalization)
        layer.trainable = unfrozen and not is_bn
