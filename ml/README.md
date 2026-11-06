# BaghBaan AI — ML

MobileNetV2 transfer learning on the PlantVillage apple subset (4 classes). Runs on a laptop CPU
(~10 min training on an Apple-silicon Mac).

```bash
uv sync
uv run python -m baghbaan_ml.prepare_data   # fetch ~51 MB, clean, stratified 70/15/15 split
uv run python -m baghbaan_ml.explore        # reports/data/*
uv run python -m baghbaan_ml.train          # models/baghbaan_mobilenetv2.keras
uv run python -m baghbaan_ml.evaluate       # reports/metrics.json + plots + Grad-CAM audit
uv run python -m baghbaan_ml.export         # models/*.tflite, model_meta.json, metrics.json
uv run pytest -q
```

| Module | Purpose |
|---|---|
| `config.py` | Seed, image size, class order, paths |
| `prepare_data.py` | Fetch (git sparse clone or `--source tfds`), verify, de-duplicate, split |
| `data.py` | `tf.data` pipelines, field-photo augmentation, class weights |
| `model.py` | MobileNetV2 classifier; input is raw RGB in [0, 255] |
| `train.py` | Phase 1 frozen backbone (lr 1e-3) → phase 2 fine-tune from `block_13` (lr 1e-5) |
| `evaluate.py` | Accuracy, per-class P/R/F1, confusion matrix, learning curves, confidence and Grad-CAM audit |
| `gradcam.py` | Grad-CAM heatmap + overlay (TF + NumPy only, reused by the backend) |
| `export.py` | Full-integer int8 TFLite (uint8 input, float32 output), verified on the test split |

Datasets, checkpoints and model files are git-ignored; `reports/` is committed.
