"""API behaviour tests (stub model)."""

from __future__ import annotations

import re

import pytest

from tests.conftest import REAL_MODEL, png_size, solid_png


def upload(client, data: bytes, content_type: str = "image/jpeg", **params):
    return client.post("/predict", params=params, files={"file": ("leaf.jpg", data, content_type)})


# ------------------------------------------------------------------ system / content


def test_health_reports_loaded_model(client) -> None:
    body = client.get("/health").json()
    assert body["status"] == "ok" and body["model_loaded"] is True
    assert re.fullmatch(r"[0-9a-f]{12}", body["model_version"])


def test_missing_model_is_graceful(make_client, sample_jpeg) -> None:
    client = make_client(model=False)
    assert client.get("/health").json()["model_loaded"] is False
    assert upload(client, sample_jpeg).status_code == 503


def test_diseases_cover_all_classes_and_languages(client) -> None:
    body = client.get("/diseases").json()
    assert {d["id"] for d in body["diseases"]} == {
        "apple_scab",
        "black_rot",
        "cedar_apple_rust",
        "healthy",
    }
    assert body["rtl_languages"] == ["ur"]
    for lang in ("en", "hi", "ur"):
        assert "SKUAST" in body["expert_note"][lang]
        for disease in body["diseases"]:
            text = disease["content"][lang]
            assert text["name"] and text["symptoms"] and text["prevention"]


def test_disease_content_has_no_pesticide_names_or_doses(client) -> None:
    """Advice must never invent chemicals or dosages; it defers to experts."""
    raw = client.get("/diseases").text.lower()
    for word in ("mancozeb", "captan", "difenoconazole", "myclobutanil", "carbendazim"):
        assert word not in raw
    assert not re.search(r"\d+\s*(g|gm|ml|kg|litre|liter|%)\b", raw)


def test_metrics(make_client, tmp_path) -> None:
    client = make_client()
    assert client.get("/metrics").json()["test"]["accuracy"] == 0.5
    (tmp_path / "metrics.json").unlink()
    assert client.get("/metrics").status_code == 404


def test_request_id_header(client) -> None:
    assert client.get("/health", headers={"x-request-id": "abc"}).headers["x-request-id"] == "abc"


# ------------------------------------------------------------------ predict


def test_confident_prediction_in_urdu(client, sample_jpeg) -> None:
    res = upload(client, sample_jpeg, lang="ur")
    assert res.status_code == 200
    body = res.json()
    assert body["prediction"] == "apple_scab" and body["low_confidence"] is False
    assert body["advice"]["name"].startswith("سیب")
    assert body["expert_note"].startswith("اسپرے")
    assert body["message"] is None
    probs = [p["probability"] for p in body["probabilities"]]
    assert probs == sorted(probs, reverse=True) and abs(sum(probs) - 1) < 1e-4
    assert png_size(body["heatmap_png_base64"]) == (448, 448)


def test_low_confidence_gives_no_diagnosis(make_client, sample_jpeg) -> None:
    client = make_client(favour_class=None)
    body = upload(client, sample_jpeg, lang="hi").json()
    assert body["low_confidence"] is True and body["confidence"] < 0.7
    assert body["prediction"] is None and body["advice"] is None
    assert body["top_class"] in {"apple_scab", "black_rot", "cedar_apple_rust", "healthy"}
    assert "विशेषज्ञ" in body["message"]
    assert body["heatmap_png_base64"]


def test_heatmap_can_be_skipped(client, sample_jpeg) -> None:
    assert upload(client, sample_jpeg, heatmap="false").json()["heatmap_png_base64"] is None


def test_non_square_png_is_accepted(client) -> None:
    assert upload(client, solid_png(300, 200), "image/png").status_code == 200


@pytest.mark.parametrize(
    ("data", "content_type", "status"),
    [
        (b"hello", "text/plain", 415),
        (b"definitely not a jpeg", "image/jpeg", 400),
        (solid_png(20, 20), "image/png", 400),
    ],
)
def test_rejects_bad_uploads(client, data, content_type, status) -> None:
    assert upload(client, data, content_type).status_code == status


def test_rejects_oversized_upload(make_client, sample_jpeg) -> None:
    client = make_client(max_upload_mb="0.005")  # ~5 KB, sample is ~12 KB
    assert upload(client, sample_jpeg).status_code == 413


def test_rejects_unknown_language(client, sample_jpeg) -> None:
    assert upload(client, sample_jpeg, lang="fr").status_code == 422


def test_rate_limit(make_client, sample_jpeg) -> None:
    client = make_client(rate_limit="2/minute")
    codes = [upload(client, sample_jpeg, heatmap="false").status_code for _ in range(3)]
    assert codes == [200, 200, 429]


# ------------------------------------------------------------------ real model (optional)


@pytest.mark.skipif(not REAL_MODEL.exists(), reason="trained model not present (CI)")
def test_real_model_diagnoses_sample(make_client, sample_jpeg) -> None:
    body = upload(make_client(model=REAL_MODEL), sample_jpeg).json()
    assert body["prediction"] == "apple_scab"
    assert body["confidence"] > 0.9
