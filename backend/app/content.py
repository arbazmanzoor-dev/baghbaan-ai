"""Disease information and fixed messages, loaded from shared/diseases.json.

The same file is bundled into the mobile app for offline use, so there is one source of truth.
"""

import json
from functools import lru_cache
from pathlib import Path

from app.schemas import Advice, DiseasesResponse, Language


@lru_cache
def load_diseases(path: Path) -> DiseasesResponse:
    raw = json.loads(path.read_text(encoding="utf-8"))
    return DiseasesResponse(
        languages=raw["languages"],
        rtl_languages=raw["rtl_languages"],
        expert_note=raw["messages"]["expert_note"],
        low_confidence_message=raw["messages"]["low_confidence"],
        diseases=raw["diseases"],
    )


def advice_for(content: DiseasesResponse, class_id: str, lang: Language) -> Advice:
    disease = next(d for d in content.diseases if d.id == class_id)
    return Advice(
        id=disease.id,
        scientific_name=disease.scientific_name,
        severity=disease.severity,
        **disease.content[lang].model_dump(),
    )


def localized_names(content: DiseasesResponse, lang: Language) -> dict[str, str]:
    return {d.id: d.content[lang].name for d in content.diseases}
