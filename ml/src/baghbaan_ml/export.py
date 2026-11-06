"""Export the trained Keras model to a quantised TFLite model for offline on-device inference.

Usage:
    uv run python -m baghbaan_ml.export [--mode int8|dynamic]

int8 (default): full-integer quantisation calibrated on training images; uint8 RGB input,
float32 probabilities out. Smallest and fastest on phone CPUs.
dynamic: int8 weights, float32 activations and input. Use if int8 loses too much accuracy.

Writes to models/:
    baghbaan_mobilenetv2_<mode>.tflite, model_meta.json, metrics.json (copy for the backend)
and adds a "tflite" section to reports/metrics.json.
"""

from __future__ import annotations

import argparse
import json
import shutil
import tempfile
import time
from pathlib import Path

import keras
import numpy as np
import tensorflow as tf

from baghbaan_ml import config
from baghbaan_ml.data import label_indices, make_dataset, records_for
from baghbaan_ml.evaluate import CONFIDENCE_THRESHOLD, METRICS_PATH
from baghbaan_ml.train import MODEL_PATH

CALIBRATION_IMAGES = 300


def convert(model: keras.Model, mode: str, calibration: tf.data.Dataset | None = None) -> bytes:
    """Convert to TFLite. int8 mode needs `calibration`: a dataset of single-image batches."""
    with tempfile.TemporaryDirectory() as tmp:
        saved = Path(tmp) / "saved_model"
        model.export(saved, verbose=False)
        converter = tf.lite.TFLiteConverter.from_saved_model(str(saved))
        converter.optimizations = [tf.lite.Optimize.DEFAULT]
        if mode == "int8":
            if calibration is None:
                raise ValueError("int8 quantisation needs calibration images")

            def representative():
                for x, _ in calibration:
                    yield [x]

            converter.representative_dataset = representative
            converter.target_spec.supported_ops = [tf.lite.OpsSet.TFLITE_BUILTINS_INT8]
            converter.inference_input_type = tf.uint8  # raw camera pixels go straight in
        return converter.convert()


def run_tflite(model_bytes: bytes, images: np.ndarray) -> tuple[np.ndarray, float, dict]:
    """Return (probabilities, mean ms per image, input tensor details) on this CPU."""
    interpreter = tf.lite.Interpreter(model_content=model_bytes, num_threads=4)
    interpreter.allocate_tensors()
    inp, out = interpreter.get_input_details()[0], interpreter.get_output_details()[0]
    scale, zero_point = inp["quantization"]
    probs, started = [], time.perf_counter()
    for img in images:
        x = img[None]
        if inp["dtype"] == np.uint8:
            x = np.clip(np.round(x / (scale or 1.0) + zero_point), 0, 255)
        interpreter.set_tensor(inp["index"], x.astype(inp["dtype"]))
        interpreter.invoke()
        probs.append(interpreter.get_tensor(out["index"])[0])
    ms = (time.perf_counter() - started) * 1000 / len(images)
    details = {
        "dtype": np.dtype(inp["dtype"]).name,
        "scale": float(scale),
        "zero_point": int(zero_point),
    }
    return np.array(probs, dtype=np.float32), ms, details


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument("--mode", choices=("int8", "dynamic"), default="int8")
    args = parser.parse_args()

    model = keras.models.load_model(MODEL_PATH)
    calibration = make_dataset(records_for("train")[:CALIBRATION_IMAGES], batch_size=1)
    tflite_bytes = convert(model, args.mode, calibration)
    tflite_path = config.MODELS_DIR / f"baghbaan_mobilenetv2_{args.mode}.tflite"
    tflite_path.write_bytes(tflite_bytes)

    test_records = records_for("test")
    images = np.concatenate([x.numpy() for x, _ in make_dataset(test_records, batch_size=64)])
    y_true = label_indices(test_records)
    keras_probs = model.predict(images, batch_size=64, verbose=0)
    lite_probs, ms, input_details = run_tflite(tflite_bytes, images)

    tflite_metrics = {
        "file": tflite_path.name,
        "mode": args.mode,
        "size_mb": round(len(tflite_bytes) / 1e6, 2),
        "test_accuracy": round(float((lite_probs.argmax(1) == y_true).mean()), 4),
        "keras_test_accuracy": round(float((keras_probs.argmax(1) == y_true).mean()), 4),
        "top1_agreement_with_keras": round(
            float((lite_probs.argmax(1) == keras_probs.argmax(1)).mean()), 4
        ),
        "mean_abs_prob_diff": round(float(np.abs(lite_probs - keras_probs).mean()), 4),
        "cpu_ms_per_image_laptop": round(ms, 1),
        "input": input_details,
    }
    meta = {
        "labels": list(config.CLASS_NAMES),
        "input_size": config.IMG_SIZE,
        "input": input_details,
        "pixel_range": [0, 255],
        "confidence_threshold": CONFIDENCE_THRESHOLD,
        "tflite_file": tflite_path.name,
    }
    (config.MODELS_DIR / "model_meta.json").write_text(json.dumps(meta, indent=2) + "\n")

    metrics = json.loads(METRICS_PATH.read_text())
    metrics["tflite"] = tflite_metrics
    METRICS_PATH.write_text(json.dumps(metrics, indent=2) + "\n")
    shutil.copy(METRICS_PATH, config.MODELS_DIR / "metrics.json")
    print(json.dumps(tflite_metrics, indent=2))


if __name__ == "__main__":
    main()
