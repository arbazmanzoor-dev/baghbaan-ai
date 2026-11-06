"""Evaluate the trained model on the held-out test split.

Usage:
    uv run python -m baghbaan_ml.evaluate

Writes to reports/:
    metrics.json, confusion_matrix.png, learning_curves.png, gradcam_examples.png
"""

from __future__ import annotations

import json
from datetime import UTC, datetime

import matplotlib

matplotlib.use("Agg")

import keras
import matplotlib.pyplot as plt
import numpy as np
from sklearn.metrics import classification_report, confusion_matrix

from baghbaan_ml import config
from baghbaan_ml.data import label_indices, make_dataset, records_for
from baghbaan_ml.explore import PRETTY
from baghbaan_ml.gradcam import gradcam, leaf_focus, leaf_mask, make_gradcam_model, overlay
from baghbaan_ml.prepare_data import read_manifest
from baghbaan_ml.train import HISTORY_PATH, MODEL_PATH

CONFIDENCE_THRESHOLD = 0.70  # below this the app says "Not sure — retake photo"
METRICS_PATH = config.REPORTS_DIR / "metrics.json"


def confidence_analysis(probs: np.ndarray, y_true: np.ndarray) -> dict[str, float]:
    """How the 70% threshold trades coverage for reliability on the test set."""
    conf, pred = probs.max(axis=1), probs.argmax(axis=1)
    confident = conf >= CONFIDENCE_THRESHOLD
    return {
        "threshold": CONFIDENCE_THRESHOLD,
        "coverage": round(float(confident.mean()), 4),
        "accuracy_when_confident": round(float((pred[confident] == y_true[confident]).mean()), 4),
        "errors_when_confident": int((pred[confident] != y_true[confident]).sum()),
        "low_confidence_count": int((~confident).sum()),
    }


def plot_confusion(cm: np.ndarray, path) -> None:
    names = [PRETTY[c] for c in config.CLASS_NAMES]
    fig, ax = plt.subplots(figsize=(6, 5))
    ax.imshow(cm, cmap="Greens")
    for i in range(cm.shape[0]):
        for j in range(cm.shape[1]):
            colour = "white" if cm[i, j] > cm.max() / 2 else "black"
            ax.text(j, i, str(cm[i, j]), ha="center", va="center", color=colour)
    ax.set_xticks(range(len(names)), names, rotation=30, ha="right")
    ax.set_yticks(range(len(names)), names)
    ax.set_xlabel("Predicted")
    ax.set_ylabel("True")
    ax.set_title("Test-set confusion matrix")
    fig.tight_layout()
    fig.savefig(path, dpi=150)
    plt.close(fig)


def plot_learning_curves(history: dict, path) -> None:
    epochs = np.arange(1, len(history["loss"]) + 1)
    boundary = history["phase"].index(2) + 0.5 if 2 in history["phase"] else None
    fig, axes = plt.subplots(1, 2, figsize=(11, 4))
    for ax, key, title in ((axes[0], "loss", "Loss"), (axes[1], "accuracy", "Accuracy")):
        ax.plot(epochs, history[key], label="train", color="#2f5d3a")
        ax.plot(epochs, history[f"val_{key}"], label="validation", color="#d68910")
        if boundary:
            ax.axvline(boundary, ls="--", color="grey")
            ax.text(boundary + 0.2, ax.get_ylim()[1], " fine-tune", va="top", color="grey")
        ax.set_title(title)
        ax.set_xlabel("Epoch")
        ax.legend(frameon=False)
        ax.spines[["top", "right"]].set_visible(False)
    fig.tight_layout()
    fig.savefig(path, dpi=150)
    plt.close(fig)


def gradcam_audit(model: keras.Model, test_records, images: np.ndarray, path) -> dict:
    """Per-class share of Grad-CAM activation on the leaf vs. the leaf's share of the frame.

    A focus well above the area share means the model attends to the leaf, not the backdrop.
    """
    grad_model = make_gradcam_model(model)
    y = label_indices(test_records)
    focus, area = np.zeros(len(images)), np.zeros(len(images))
    examples: dict[int, list[tuple[np.ndarray, np.ndarray]]] = {}
    for i, img in enumerate(images):
        heat, _ = gradcam(grad_model, img)
        mask = leaf_mask(img)
        focus[i], area[i] = leaf_focus(heat, mask), mask.mean()
        if len(examples.setdefault(int(y[i]), [])) < 3:
            examples[int(y[i])].append((img, heat))

    fig, axes = plt.subplots(len(config.CLASS_NAMES), 6, figsize=(12, 8.5))
    for row, cls in enumerate(config.CLASS_NAMES):
        for k, (img, heat) in enumerate(examples[row]):
            axes[row, 2 * k].imshow(img.astype("uint8"))
            axes[row, 2 * k + 1].imshow(overlay(img, heat))
        axes[row, 0].set_title(PRETTY[cls], loc="left", fontsize=10)
    for ax in axes.flat:
        ax.axis("off")
    fig.suptitle("Grad-CAM on test images (photo | heatmap)")
    fig.tight_layout()
    fig.savefig(path, dpi=110)
    plt.close(fig)

    return {
        cls: {
            "leaf_focus_mean": round(float(focus[y == i].mean()), 3),
            "leaf_area_fraction_mean": round(float(area[y == i].mean()), 3),
        }
        for i, cls in enumerate(config.CLASS_NAMES)
    }


def main() -> None:
    keras.utils.set_random_seed(config.SEED)
    config.REPORTS_DIR.mkdir(parents=True, exist_ok=True)
    model = keras.models.load_model(MODEL_PATH)
    test_records = records_for("test")
    ds = make_dataset(test_records, batch_size=64)
    images = np.concatenate([x.numpy() for x, _ in ds])
    probs = model.predict(images, batch_size=64, verbose=0)
    y_true, y_pred = label_indices(test_records), probs.argmax(axis=1)

    report = classification_report(
        y_true, y_pred, target_names=list(config.CLASS_NAMES), output_dict=True, digits=4
    )
    cm = confusion_matrix(y_true, y_pred, labels=range(len(config.CLASS_NAMES)))
    history = json.loads(HISTORY_PATH.read_text())
    plot_confusion(cm, config.REPORTS_DIR / "confusion_matrix.png")
    plot_learning_curves(history, config.REPORTS_DIR / "learning_curves.png")
    focus = gradcam_audit(model, test_records, images, config.REPORTS_DIR / "gradcam_examples.png")

    records = read_manifest()
    metrics = {
        "generated_at": datetime.now(UTC).isoformat(timespec="seconds"),
        "model": {
            "name": model.name,
            "backbone": "MobileNetV2 (ImageNet), alpha=1.0",
            "input_size": config.IMG_SIZE,
            "params": int(model.count_params()),
            "keras_size_mb": round(MODEL_PATH.stat().st_size / 1e6, 2),
        },
        "dataset": {
            "name": "PlantVillage (apple subset, lab conditions)",
            "per_split": {s: sum(r.split == s for r in records) for s in config.SPLIT_FRACTIONS},
        },
        "training": {
            "epochs_frozen": history["phase"].count(1),
            "epochs_finetune": history["phase"].count(2),
            "train_minutes": round(history["train_minutes"], 1),
        },
        "test": {
            "accuracy": round(report["accuracy"], 4),
            "macro_f1": round(report["macro avg"]["f1-score"], 4),
            "weighted_f1": round(report["weighted avg"]["f1-score"], 4),
            "per_class": {
                c: {
                    "precision": round(report[c]["precision"], 4),
                    "recall": round(report[c]["recall"], 4),
                    "f1": round(report[c]["f1-score"], 4),
                    "support": int(report[c]["support"]),
                }
                for c in config.CLASS_NAMES
            },
            "labels": list(config.CLASS_NAMES),
            "confusion_matrix": cm.tolist(),
        },
        "confidence": confidence_analysis(probs, y_true),
        "gradcam_leaf_focus": focus,
    }
    METRICS_PATH.write_text(json.dumps(metrics, indent=2) + "\n")
    print(
        json.dumps({k: metrics[k] for k in ("test", "confidence", "gradcam_leaf_focus")}, indent=2)
    )


if __name__ == "__main__":
    main()
