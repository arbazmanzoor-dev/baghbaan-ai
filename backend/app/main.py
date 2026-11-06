"""BaghBaan AI inference API.

Run locally:  uv run uvicorn app.main:app --reload
Docs:         http://localhost:8000/docs
"""

import json
import logging
import time
import uuid
from collections.abc import AsyncIterator
from contextlib import asynccontextmanager
from typing import Annotated

from fastapi import Depends, FastAPI, File, HTTPException, Query, Request, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.util import get_remote_address

from app.auth import create_auth_router
from app.config import DEV_JWT_SECRET, Settings, get_settings
from app.content import advice_for, load_diseases, localized_names
from app.db import make_session_factory
from app.imaging import ALLOWED_CONTENT_TYPES, InvalidImageError, load_image, to_png_base64
from app.logging_config import configure_logging
from app.model_service import ModelService
from app.schemas import (
    ClassProbability,
    DiseasesResponse,
    ErrorResponse,
    HealthResponse,
    Language,
    MetricsResponse,
    PredictResponse,
)

log = logging.getLogger("baghbaan.api")


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncIterator[None]:
    settings = get_settings()
    configure_logging(settings.log_level)
    app.state.session_factory = make_session_factory(settings.database_url)
    if settings.jwt_secret == DEV_JWT_SECRET:
        log.warning("JWT_SECRET is the development default; set a strong secret in production")
    app.state.model = None
    if settings.model_path.exists():
        app.state.model = ModelService(
            settings.model_path, settings.gradcam_layer, settings.img_size, settings.heatmap_size
        )
    else:
        log.warning(
            "Model file not found; /predict will return 503",
            extra={"path": str(settings.model_path)},
        )
    yield


def create_app() -> FastAPI:
    settings = get_settings()
    app = FastAPI(
        title="BaghBaan AI API",
        version="1.0.0",
        description="Apple leaf disease detection for Kashmir orchards: diagnosis, confidence, "
        "Grad-CAM heatmap and advice in English, Hindi and Urdu.",
        lifespan=lifespan,
    )
    # One limiter per app: slowapi registers limits by function name, so a shared limiter
    # would count each request once per app instance ever created.
    limiter = Limiter(key_func=get_remote_address)
    app.state.limiter = limiter
    app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origin_list,
        allow_methods=["GET", "POST"],
        allow_headers=["*"],
    )

    @app.middleware("http")
    async def request_log(request: Request, call_next):
        request_id = request.headers.get("x-request-id") or uuid.uuid4().hex[:12]
        started = time.perf_counter()
        response = await call_next(request)
        response.headers["x-request-id"] = request_id
        log.info(
            "request",
            extra={
                "request_id": request_id,
                "method": request.method,
                "path": request.url.path,
                "status": response.status_code,
                "duration_ms": round((time.perf_counter() - started) * 1000, 1),
                "client": get_remote_address(request),
            },
        )
        return response

    register_routes(app, limiter)
    app.include_router(create_auth_router(limiter))
    return app


def model_service(request: Request) -> ModelService:
    service: ModelService | None = request.app.state.model
    if service is None:
        raise HTTPException(503, "Model is not loaded. See server logs.")
    return service


def register_routes(app: FastAPI, limiter: Limiter) -> None:
    @app.get("/health", response_model=HealthResponse, tags=["system"])
    def health(request: Request) -> HealthResponse:
        service: ModelService | None = request.app.state.model
        return HealthResponse(
            status="ok",
            model_loaded=service is not None,
            model_version=service.version if service else None,
        )

    @app.get("/diseases", response_model=DiseasesResponse, tags=["content"])
    def diseases(settings: Annotated[Settings, Depends(get_settings)]) -> DiseasesResponse:
        """All disease information in every supported language."""
        return load_diseases(settings.diseases_path)

    @app.get(
        "/metrics",
        response_model=MetricsResponse,
        tags=["model"],
        responses={404: {"model": ErrorResponse}},
    )
    def metrics(settings: Annotated[Settings, Depends(get_settings)]) -> MetricsResponse:
        """Model performance on the held-out PlantVillage test split."""
        if not settings.metrics_path.exists():
            raise HTTPException(404, "Metrics file not found")
        return MetricsResponse(**json.loads(settings.metrics_path.read_text()))

    @app.post(
        "/predict",
        response_model=PredictResponse,
        tags=["model"],
        responses={
            400: {"model": ErrorResponse},
            413: {"model": ErrorResponse},
            415: {"model": ErrorResponse},
            429: {"model": ErrorResponse},
            503: {"model": ErrorResponse},
        },
    )
    @limiter.limit(lambda: get_settings().rate_limit)
    def predict(
        request: Request,
        settings: Annotated[Settings, Depends(get_settings)],
        service: Annotated[ModelService, Depends(model_service)],
        file: Annotated[UploadFile, File(description="Photo of a single apple leaf")],
        lang: Annotated[Language, Query(description="Language for advice")] = "en",
        heatmap: Annotated[bool, Query(description="Include the Grad-CAM overlay")] = True,
    ) -> PredictResponse:
        """Diagnose an apple leaf photo.

        Below the confidence threshold the response has `prediction: null`, no advice and a
        "not sure" message; probabilities and the heatmap are still returned.
        """
        if file.content_type not in ALLOWED_CONTENT_TYPES:
            raise HTTPException(415, "Upload a JPEG, PNG or WebP image")
        data = file.file.read(settings.max_upload_bytes + 1)
        if len(data) > settings.max_upload_bytes:
            raise HTTPException(413, f"Image larger than {settings.max_upload_mb:g} MB")
        try:
            img = load_image(data)
        except InvalidImageError as exc:
            raise HTTPException(400, str(exc)) from exc

        started = time.perf_counter()
        result = service.predict(img, with_heatmap=heatmap)
        inference_ms = round((time.perf_counter() - started) * 1000, 1)

        content = load_diseases(settings.diseases_path)
        names = localized_names(content, lang)
        probs = {
            c: float(p) for c, p in zip(settings.class_names, result.probabilities, strict=True)
        }
        ranked = sorted(probs.items(), key=lambda kv: kv[1], reverse=True)
        top_class, confidence = ranked[0]
        low = confidence < settings.confidence_threshold

        log.info(
            "prediction",
            extra={
                "top_class": top_class,
                "confidence": round(confidence, 4),
                "low_confidence": low,
                "inference_ms": inference_ms,
                "lang": lang,
            },
        )
        return PredictResponse(
            prediction=None if low else top_class,
            top_class=top_class,
            confidence=confidence,
            low_confidence=low,
            confidence_threshold=settings.confidence_threshold,
            probabilities=[ClassProbability(id=c, name=names[c], probability=p) for c, p in ranked],
            heatmap_png_base64=(
                to_png_base64(result.heatmap_overlay)
                if result.heatmap_overlay is not None
                else None
            ),
            advice=None if low else advice_for(content, top_class, lang),
            message=content.low_confidence_message[lang] if low else None,
            expert_note=content.expert_note[lang],
            language=lang,
            model_version=service.version,
            inference_ms=inference_ms,
        )


app = create_app()
