from pathlib import Path

from dotenv import load_dotenv
from fastapi import Depends, FastAPI, HTTPException, Security, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security.api_key import APIKeyHeader

load_dotenv(Path(__file__).resolve().parent.parent / ".env")

import os

from ai_service import reconcile_medications, validate_data_quality
from models import (
    DataQualityRequest,
    DataQualityResponse,
    MedicationReconciliationRequest,
    MedicationReconciliationResponse,
)

# ---------------------------------------------------------------------------
# API key auth
# ---------------------------------------------------------------------------

_API_KEY = os.environ.get("API_KEY", "")
_api_key_header = APIKeyHeader(name="X-API-Key", auto_error=False)


def require_api_key(key: str | None = Security(_api_key_header)) -> str:
    if not _API_KEY:
        raise RuntimeError("API_KEY environment variable is not set")
    if key != _API_KEY:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Invalid or missing API key")
    return key

# ---------------------------------------------------------------------------
# App
# ---------------------------------------------------------------------------

app = FastAPI(
    title="Clinical Data Reconciliation Engine",
    description="Reconciles conflicting patient medication records and evaluates clinical data quality.",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------

@app.get("/health")
def health_check() -> dict:
    return {"status": "ok"}


@app.post(
    "/api/reconcile/medication",
    response_model=MedicationReconciliationResponse,
    summary="Reconcile conflicting medication records",
)
def reconcile_medication(
    body: MedicationReconciliationRequest,
    _: str = Depends(require_api_key),
) -> MedicationReconciliationResponse:
    """
    Accepts two or more conflicting medication records from different healthcare
    systems and returns the most clinically plausible reconciled entry with a
    confidence score, reasoning, recommended actions, and a safety check.
    """
    try:
        return reconcile_medications(body)
    except RuntimeError as exc:
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=str(exc))


@app.post(
    "/api/validate/data-quality",
    response_model=DataQualityResponse,
    summary="Validate patient record data quality",
)
def validate_data_quality_endpoint(
    body: DataQualityRequest,
    _: str = Depends(require_api_key),
) -> DataQualityResponse:
    """
    Accepts a patient record and returns an overall data quality score (0–100)
    broken down by completeness, accuracy, timeliness, and clinical plausibility,
    along with a list of specific issues detected.
    """
    try:
        return validate_data_quality(body)
    except RuntimeError as exc:
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=str(exc))
