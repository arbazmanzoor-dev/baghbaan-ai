# syntax=docker/dockerfile:1
# BaghBaan AI inference API.
# Build from the repository root (the image needs shared/diseases.json):
#   docker build -f backend/Dockerfile -t baghbaan-api .
# The trained model is not in git. Either put baghbaan_mobilenetv2.keras + metrics.json in
# backend/models/ before building, mount them at /app/models at runtime, or pass download
# URLs (e.g. GitHub release assets) for cloud builds:
#   --build-arg MODEL_URL=https://.../baghbaan_mobilenetv2.keras \
#   --build-arg METRICS_URL=https://.../metrics.json

FROM python:3.12-slim

COPY --from=ghcr.io/astral-sh/uv:0.10.10 /uv /usr/local/bin/uv

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    UV_COMPILE_BYTECODE=1 \
    UV_LINK_MODE=copy \
    UV_PROJECT_ENVIRONMENT=/opt/venv \
    PATH="/opt/venv/bin:$PATH"

WORKDIR /app

# Dependencies first for layer caching; versions come from the lock file.
COPY backend/pyproject.toml backend/uv.lock backend/.python-version ./
RUN uv sync --frozen --no-dev --no-install-project

COPY backend/app ./app
COPY shared ./shared
COPY backend/models ./models

ARG MODEL_URL=""
ARG METRICS_URL=""
RUN python - <<'PY'
import os, urllib.request
for url, name in ((os.environ["MODEL_URL"], "baghbaan_mobilenetv2.keras"),
                  (os.environ["METRICS_URL"], "metrics.json")):
    if url:
        print(f"Downloading {name}")
        urllib.request.urlretrieve(url, f"/app/models/{name}")
PY

ENV DISEASES_PATH=/app/shared/diseases.json \
    MODEL_PATH=/app/models/baghbaan_mobilenetv2.keras \
    METRICS_PATH=/app/models/metrics.json \
    DATABASE_URL=sqlite:////app/data/baghbaan.db \
    PORT=8000

# /app/data holds the accounts database; mount a volume there to keep it across restarts.
# UID 1000 is what Hugging Face Spaces runs containers as.
RUN useradd --create-home --uid 1000 appuser \
    && mkdir -p /app/data && chown appuser:appuser /app/data
USER 1000
VOLUME ["/app/data"]

EXPOSE 8000
HEALTHCHECK --interval=30s --timeout=5s --start-period=60s --retries=3 \
  CMD python -c "import os,urllib.request; urllib.request.urlopen(f'http://127.0.0.1:{os.environ[\"PORT\"]}/health', timeout=4)"

# One worker: the model is held in memory per process. PORT is set by Render/Railway/HF Spaces.
CMD ["sh", "-c", "uvicorn app.main:app --host 0.0.0.0 --port ${PORT} --proxy-headers --forwarded-allow-ips='*'"]
