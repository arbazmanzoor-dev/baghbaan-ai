"""Pydantic request/response models (also drive the OpenAPI docs at /docs)."""

from typing import Any, Literal

from pydantic import BaseModel, Field

Language = Literal["en", "hi", "ur"]
ClassId = Literal["apple_scab", "black_rot", "cedar_apple_rust", "healthy"]
Severity = Literal["high", "moderate", "none"]


class HealthResponse(BaseModel):
    status: Literal["ok"]
    model_loaded: bool
    model_version: str | None = Field(
        None, description="First 12 hex chars of the model file's SHA-256"
    )


class DiseaseText(BaseModel):
    name: str
    summary: str
    description: str
    symptoms: list[str]
    prevention: list[str]
    management: list[str]


class Disease(BaseModel):
    id: ClassId
    scientific_name: str
    pathogen: str
    severity: Severity
    content: dict[Language, DiseaseText]


class DiseasesResponse(BaseModel):
    languages: list[Language]
    rtl_languages: list[Language]
    expert_note: dict[Language, str]
    low_confidence_message: dict[Language, str]
    diseases: list[Disease]


class ClassProbability(BaseModel):
    id: ClassId
    name: str = Field(description="Localised class name")
    probability: float = Field(ge=0, le=1)


class Advice(BaseModel):
    """Disease information in the requested language."""

    id: ClassId
    scientific_name: str
    severity: Severity
    name: str
    summary: str
    description: str
    symptoms: list[str]
    prevention: list[str]
    management: list[str]


class PredictResponse(BaseModel):
    prediction: ClassId | None = Field(
        description="Diagnosed class, or null when confidence is below the threshold"
    )
    top_class: ClassId = Field(description="Most likely class, even when not confident")
    confidence: float = Field(ge=0, le=1, description="Probability of top_class")
    low_confidence: bool
    confidence_threshold: float
    probabilities: list[ClassProbability] = Field(description="All classes, highest first")
    heatmap_png_base64: str | None = Field(
        description="Grad-CAM overlay on the analysed (square-cropped) photo, PNG, base64"
    )
    advice: Advice | None = Field(description="Disease info; null when low_confidence")
    message: str | None = Field(description="Localised 'not sure' message when low_confidence")
    expert_note: str = Field(description="Always shown: consult an expert before spraying")
    language: Language
    model_version: str
    inference_ms: float


class MetricsResponse(BaseModel):
    """Model performance report produced by ml/src/baghbaan_ml/evaluate.py + export.py."""

    model_config = {"extra": "allow"}

    generated_at: str
    model: dict[str, Any]
    test: dict[str, Any]
    confidence: dict[str, Any]


class ErrorResponse(BaseModel):
    detail: str
