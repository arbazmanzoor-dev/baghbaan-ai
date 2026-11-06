"""Two-phase transfer learning: frozen backbone, then fine-tune the top MobileNetV2 blocks.

Usage:
    uv run python -m baghbaan_ml.train [--epochs-frozen 12] [--epochs-finetune 15]

Writes:
    models/baghbaan_mobilenetv2.keras   final model (best val-loss epoch of fine-tuning)
    checkpoints/phase{1,2}.keras        per-phase best checkpoints
    reports/history.json                per-epoch metrics for the learning curves
"""

from __future__ import annotations

import argparse
import json
import logging
import time

import keras

from baghbaan_ml import config
from baghbaan_ml.data import class_weights, make_dataset, records_for
from baghbaan_ml.model import build_model, set_backbone_trainable

log = logging.getLogger(__name__)

CHECKPOINT_DIR = config.ML_ROOT / "checkpoints"
MODEL_PATH = config.MODELS_DIR / "baghbaan_mobilenetv2.keras"
HISTORY_PATH = config.REPORTS_DIR / "history.json"


def compile_model(model: keras.Model, learning_rate: float) -> None:
    model.compile(
        optimizer=keras.optimizers.Adam(learning_rate),
        loss=keras.losses.CategoricalCrossentropy(label_smoothing=0.05),
        metrics=["accuracy"],
    )


def callbacks(phase: int) -> list[keras.callbacks.Callback]:
    return [
        keras.callbacks.EarlyStopping(
            monitor="val_loss", patience=4, restore_best_weights=True, verbose=1
        ),
        keras.callbacks.ModelCheckpoint(
            CHECKPOINT_DIR / f"phase{phase}.keras", monitor="val_loss", save_best_only=True
        ),
        keras.callbacks.ReduceLROnPlateau(monitor="val_loss", factor=0.3, patience=2, verbose=1),
    ]


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument("--epochs-frozen", type=int, default=12)
    parser.add_argument("--epochs-finetune", type=int, default=15)
    parser.add_argument("--batch-size", type=int, default=32)
    args = parser.parse_args()
    logging.basicConfig(level=logging.INFO, format="%(levelname)s %(message)s")
    keras.utils.set_random_seed(config.SEED)
    for d in (CHECKPOINT_DIR, config.MODELS_DIR, config.REPORTS_DIR):
        d.mkdir(parents=True, exist_ok=True)

    train_records, val_records = records_for("train"), records_for("val")
    train_ds = make_dataset(train_records, batch_size=args.batch_size, training=True)
    val_ds = make_dataset(val_records, batch_size=args.batch_size)
    weights = class_weights(train_records)
    log.info("Class weights: %s", weights)

    model = build_model()
    history: dict[str, list[float]] = {}
    started = time.perf_counter()

    for phase, (fine_tune, lr, epochs) in enumerate(
        ((False, 1e-3, args.epochs_frozen), (True, 1e-5, args.epochs_finetune)), start=1
    ):
        set_backbone_trainable(model, fine_tune=fine_tune)
        compile_model(model, lr)  # recompile so trainability changes take effect
        trainable = sum(int(keras.ops.size(w)) for w in model.trainable_weights)
        log.info("Phase %d: lr=%g, trainable params=%s", phase, lr, f"{trainable:,}")
        h = model.fit(
            train_ds,
            validation_data=val_ds,
            epochs=epochs,
            class_weight=weights,
            callbacks=callbacks(phase),
            verbose=2,
        )
        for key, values in h.history.items():
            history.setdefault(key, []).extend(float(v) for v in values)
        history.setdefault("phase", []).extend([phase] * len(h.history["loss"]))

    model.save(MODEL_PATH)
    minutes = (time.perf_counter() - started) / 60
    HISTORY_PATH.write_text(json.dumps({**history, "train_minutes": minutes}, indent=2) + "\n")
    log.info("Saved %s after %.1f min", MODEL_PATH, minutes)


if __name__ == "__main__":
    main()
