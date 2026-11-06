# Deploying BaghBaan AI

The backend is one Docker image ([`backend/Dockerfile`](../backend/Dockerfile), built from the repo root). The mobile app is built with EAS and points at the backend through `EXPO_PUBLIC_API_URL`.

## Before you start

**1. Publish the trained model.** Model files are not in git (23 MB). Upload them where a build can download them; a GitHub release is simplest:

```bash
gh release create model-v1 ml/models/baghbaan_mobilenetv2.keras ml/models/metrics.json --title "Model v1" --notes "MobileNetV2, 98.3% test accuracy"
```

The download URLs look like `https://github.com/<owner>/<repo>/releases/download/model-v1/baghbaan_mobilenetv2.keras`. Pass them to the build as `MODEL_URL` and `METRICS_URL` (Docker build arguments).

**2. Generate a JWT secret** (signs sign-in sessions; never reuse the development default):

```bash
python3 -c "import secrets; print(secrets.token_urlsafe(48))"
```

**3. Memory.** The API holds TensorFlow and the model in memory: about **650 MB** after the first prediction (measured). Choose an instance with **at least 1 GB of RAM**. 512 MB free tiers will run out of memory.

### Environment variables

| Variable | Required | Example / default |
|---|---|---|
| `JWT_SECRET` | **yes** | the value generated above |
| `PORT` | depends on host | `8000` (the image listens on `$PORT`) |
| `CORS_ORIGINS` | no | `*` — the mobile app doesn't need CORS; restrict if you add a web client |
| `DATABASE_URL` | no | `sqlite:////app/data/baghbaan.db`; use a Postgres URL (`postgresql+psycopg://…`) on hosts without persistent disks, after adding a Postgres driver to `backend/pyproject.toml` |
| `RATE_LIMIT` / `AUTH_RATE_LIMIT` | no | `30/minute` / `10/minute` |
| `MAX_UPLOAD_MB` | no | `8` |
| `LOG_LEVEL` | no | `INFO` |

**Accounts need durable storage.** With SQLite, mount a persistent volume at `/app/data`; otherwise accounts disappear on every restart or redeploy. Scanning itself is stateless and needs no storage.

## Render

1. **New → Web Service**, connect the GitHub repo.
2. **Language:** Docker. **Dockerfile Path:** `backend/Dockerfile`. Leave the build context at the repo root (the image needs `shared/`).
3. **Instance type:** one with ≥ 1 GB RAM (the free 512 MB instance is too small).
4. **Environment:** `JWT_SECRET`, `PORT=8000`. Add build-time `MODEL_URL` and `METRICS_URL` (Render passes service environment variables to Docker builds as build arguments).
5. **Health check path:** `/health`.
6. For accounts, attach a **persistent disk** mounted at `/app/data` (paid plans), or use Render Postgres via `DATABASE_URL`.

Free Render services sleep after 15 minutes idle and take about a minute to wake. The app copes, because it falls back to on-device analysis if the server doesn't answer.

## Railway

1. **New Project → Deploy from GitHub repo.**
2. Service **Variables**:
   - `RAILWAY_DOCKERFILE_PATH=backend/Dockerfile`
   - `PORT=8000`
   - `JWT_SECRET=…`
   - `MODEL_URL=…`, `METRICS_URL=…`
3. **Settings → Networking → Generate Domain**, target port 8000.
4. For accounts: add a **Volume** mounted at `/app/data`. Railway mounts volumes as root, so also set `RAILWAY_RUN_UID=0`. Alternatively, add a Railway Postgres database and set `DATABASE_URL`.

## Hugging Face Spaces (Docker)

Docker Spaces need a paid Hugging Face plan (PRO for personal accounts). The free CPU Basic hardware has 16 GB of RAM, which is plenty.

1. Create a **Docker** Space.
2. Push a copy of the repo to the Space with a `Dockerfile` at its root containing:
   ```dockerfile
   FROM ghcr.io/<owner>/baghbaan-api:latest
   ENV PORT=7860
   ```
   (after pushing the image built by `docker build -f backend/Dockerfile --build-arg MODEL_URL=… --build-arg METRICS_URL=… -t ghcr.io/<owner>/baghbaan-api:latest .`), or copy `backend/Dockerfile` to the root and add `ENV PORT=7860`.
3. Add this front matter to the Space's `README.md`:
   ```yaml
   ---
   title: BaghBaan AI
   emoji: 🍎
   colorFrom: green
   colorTo: green
   sdk: docker
   app_port: 7860
   ---
   ```
4. **Settings → Variables and secrets:** add `JWT_SECRET` as a secret.
5. Space disks are wiped on restart. For accounts, attach a storage bucket at `/app/data`, or use an external Postgres via `DATABASE_URL`.

The image already runs as UID 1000, as Spaces require.

## Point the app at the server

```bash
cd mobile && npx eas-cli@latest env:create --environment preview --name EXPO_PUBLIC_API_URL --value https://YOUR-API-URL
```

Repeat with `--environment production` for store builds, then build (see the README's [Android APK](../README.md#android-apk) section). Check the deployment from a phone with **Settings → BaghBaan server**, which should read "Reachable".

## Production checklist

- [ ] `JWT_SECRET` set (the server logs a warning while it is the default)
- [ ] Instance has ≥ 1 GB RAM
- [ ] `/health` returns `"model_loaded": true`
- [ ] Persistent storage or Postgres for accounts
- [ ] HTTPS URL used in `EXPO_PUBLIC_API_URL` (Android blocks plain HTTP in release builds)
- [ ] Advice text and translations reviewed by SKUAST-Kashmir / Department of Horticulture experts
