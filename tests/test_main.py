"""
Unit tests for the Clinical Data Reconciliation Engine API.

Environment variables and sys.path are configured before any backend modules
are imported, because ai_service.py instantiates genai.Client at module level
using os.environ["GEMINI_API_KEY"].
"""

import os
import sys
from pathlib import Path
from unittest.mock import MagicMock, patch

# ---------------------------------------------------------------------------
# Bootstrap: add backend to path and set required env vars BEFORE any import
# that triggers ai_service.py's module-level genai.Client(...) call.
# ---------------------------------------------------------------------------

sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "backend"))

os.environ.setdefault("GEMINI_API_KEY", "test-gemini-key")
os.environ.setdefault("API_KEY", "test-api-key")

# ---------------------------------------------------------------------------
# Now it is safe to import the FastAPI app and models.
# ---------------------------------------------------------------------------

import pytest
from fastapi.testclient import TestClient

import ai_service
import database
from main import app
from models import (
    ClinicalSafetyCheck,
    DataQualityResponse,
    DetectedIssue,
    MedicationReconciliationResponse,
    QualityDimensionBreakdown,
)

# ---------------------------------------------------------------------------
# Test client + shared constants
# ---------------------------------------------------------------------------

client = TestClient(app)

VALID_HEADERS = {"X-API-Key": "test-api-key"}

RECONCILE_URL = "/api/reconcile/medication"
VALIDATE_URL = "/api/validate/data-quality"

MEDICATION_RECONCILE_PAYLOAD = {
    "patient_context": {
        "age": 65,
        "conditions": ["Type 2 Diabetes", "Hypertension"],
        "recent_labs": {"HbA1c": 7.2, "eGFR": 58},
    },
    "sources": [
        {
            "system": "EHR-A",
            "medication": "Metformin 500mg twice daily",
            "last_updated": "2026-03-20T10:00:00Z",
            "source_reliability": 0.9,
        },
        {
            "system": "Pharmacy-B",
            "medication": "Metformin 1000mg twice daily",
            "last_updated": "2026-03-22T08:00:00Z",
            "source_reliability": 0.8,
        },
    ],
}

DATA_QUALITY_PAYLOAD = {
    "demographics": {
        "name": "Jane Smith",
        "date_of_birth": "1960-05-15",
        "gender": "female",
        "address": "123 Main St",
        "phone": "555-0100",
        "insurance_id": "INS-001",
    },
    "medications": [
        {
            "name": "Metformin",
            "dose": "500mg",
            "frequency": "twice daily",
            "prescriber": "Dr. Adams",
            "start_date": "2024-01-01",
        }
    ],
    "allergies": [
        {"allergen": "Penicillin", "reaction": "Rash", "severity": "moderate"}
    ],
    "conditions": [{"name": "Type 2 Diabetes", "onset_date": "2020-06-01", "status": "active"}],
    "vital_signs": {
        "blood_pressure": "120/80 mmHg",
        "heart_rate": 72,
        "temperature": 37.0,
        "respiratory_rate": 16,
        "oxygen_saturation": 98,
        "weight_kg": 70,
        "height_cm": 165,
    },
    "last_updated": "2026-03-24T09:00:00Z",
}


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _make_reconcile_mock() -> MagicMock:
    """Return a mock genai response whose .parsed is a valid reconciliation result."""
    parsed = MedicationReconciliationResponse(
        reconciled_medication="Metformin 1000mg twice daily",
        confidence_score=0.85,
        reasoning="The Pharmacy-B record is more recent and has a standard therapeutic dose.",
        recommended_actions=["Confirm dose with prescribing physician"],
        clinical_safety_check=ClinicalSafetyCheck(safe=True, warnings=[]),
    )
    mock_response = MagicMock()
    mock_response.parsed = parsed
    return mock_response


def _make_validate_mock() -> MagicMock:
    """Return a mock genai response whose .parsed is a valid data quality result."""
    parsed = DataQualityResponse(
        overall_score=88.5,
        breakdown=QualityDimensionBreakdown(
            completeness=95.0,
            accuracy=90.0,
            timeliness=100.0,
            clinical_plausibility=85.0,
        ),
        issues_detected=[
            DetectedIssue(
                field="demographics.phone",
                issue="Phone number is not in a standard format",
                severity="low",
            )
        ],
    )
    mock_response = MagicMock()
    mock_response.parsed = parsed
    return mock_response


# ---------------------------------------------------------------------------
# Test 1 — Successful medication reconciliation
# ---------------------------------------------------------------------------

def test_reconcile_medication_success():
    """POST /api/reconcile/medication returns 200 with a well-formed reconciliation."""
    mock_resp = _make_reconcile_mock()

    with patch.object(ai_service.client.models, "generate_content", return_value=mock_resp):
        response = client.post(RECONCILE_URL, json=MEDICATION_RECONCILE_PAYLOAD, headers=VALID_HEADERS)

    assert response.status_code == 200
    body = response.json()
    assert "reconciled_medication" in body
    assert "confidence_score" in body
    assert 0.0 <= body["confidence_score"] <= 1.0
    assert "reasoning" in body
    assert "recommended_actions" in body
    assert "clinical_safety_check" in body
    assert body["reconciled_medication"] == "Metformin 1000mg twice daily"


# ---------------------------------------------------------------------------
# Test 2 — Successful data quality validation
# ---------------------------------------------------------------------------

def test_validate_data_quality_success():
    """POST /api/validate/data-quality returns 200 with a scored breakdown."""
    mock_resp = _make_validate_mock()

    with patch.object(ai_service.client.models, "generate_content", return_value=mock_resp):
        response = client.post(VALIDATE_URL, json=DATA_QUALITY_PAYLOAD, headers=VALID_HEADERS)

    assert response.status_code == 200
    body = response.json()
    assert "overall_score" in body
    assert 0.0 <= body["overall_score"] <= 100.0
    assert "breakdown" in body
    breakdown = body["breakdown"]
    for dim in ("completeness", "accuracy", "timeliness", "clinical_plausibility"):
        assert dim in breakdown
        assert 0.0 <= breakdown[dim] <= 100.0
    assert "issues_detected" in body


# ---------------------------------------------------------------------------
# Test 3 — Invalid / missing API key is rejected
# ---------------------------------------------------------------------------

@pytest.mark.parametrize(
    "headers",
    [
        {},  # no header at all
        {"X-API-Key": "wrong-key"},  # wrong value
        {"X-API-Key": ""},  # empty value
    ],
)
def test_invalid_api_key_rejected(headers):
    """Requests with a bad or absent X-API-Key header must be rejected with 401."""
    # No AI call should ever be made for unauthenticated requests.
    response = client.post(RECONCILE_URL, json=MEDICATION_RECONCILE_PAYLOAD, headers=headers)
    assert response.status_code == 401
    assert "Invalid or missing API key" in response.json()["detail"]


# ---------------------------------------------------------------------------
# Test 4 — Pydantic validation error on missing required fields
# ---------------------------------------------------------------------------

def test_reconcile_missing_required_fields():
    """POST /api/reconcile/medication with fewer than 2 sources returns 422."""
    bad_payload = {
        "patient_context": {"age": 40, "conditions": [], "recent_labs": {}},
        "sources": [
            # Only one source — violates min_length=2 constraint
            {
                "system": "EHR-A",
                "medication": "Aspirin 81mg daily",
                "last_updated": "2026-03-01T00:00:00Z",
                "source_reliability": 0.7,
            }
        ],
    }
    response = client.post(RECONCILE_URL, json=bad_payload, headers=VALID_HEADERS)
    assert response.status_code == 422


def test_validate_missing_required_fields():
    """POST /api/validate/data-quality without vital_signs returns 422."""
    bad_payload = {
        "demographics": {"name": "No Vitals"},
        # vital_signs is required but absent
        "last_updated": "2026-03-24T00:00:00Z",
    }
    response = client.post(VALIDATE_URL, json=bad_payload, headers=VALID_HEADERS)
    assert response.status_code == 422


# ---------------------------------------------------------------------------
# Test 5 — Graceful handling of AI service failure
# ---------------------------------------------------------------------------

def test_reconcile_ai_service_failure():
    """If the Gemini API raises an exception, the endpoint returns 502."""
    # Clear the in-memory cache so the service actually calls the (mocked) AI.
    database.reconciliation_cache.clear()

    with patch.object(
        ai_service.client.models,
        "generate_content",
        side_effect=Exception("Simulated Gemini timeout"),
    ):
        response = client.post(RECONCILE_URL, json=MEDICATION_RECONCILE_PAYLOAD, headers=VALID_HEADERS)

    assert response.status_code == 502
    assert "Gemini reconciliation call failed" in response.json()["detail"]


def test_validate_ai_service_failure():
    """If the Gemini API raises an exception on validation, the endpoint returns 502."""
    # Clear the in-memory cache so the service actually calls the (mocked) AI.
    database.validation_cache.clear()

    with patch.object(
        ai_service.client.models,
        "generate_content",
        side_effect=Exception("Simulated Gemini timeout"),
    ):
        response = client.post(VALIDATE_URL, json=DATA_QUALITY_PAYLOAD, headers=VALID_HEADERS)

    assert response.status_code == 502
    assert "Gemini validation call failed" in response.json()["detail"]
