"""
ai_service.py — LLM integration layer for the Clinical Data Reconciliation Engine.

Prompt Engineering Approach
---------------------------
Both prompts follow a structured three-part pattern:

1. **Role assignment**: The model is primed as a domain specialist (clinical
   pharmacist or clinical data quality analyst) so that responses emphasise
   medical reasoning over generic text generation.

2. **Structured context injection**: Patient-specific data is serialised as
   indented JSON and embedded verbatim in the prompt. This avoids ambiguity
   that free-text paraphrasing can introduce and keeps the model anchored to
   the exact values supplied by the caller.

3. **Explicit output contract**: A `response_schema` backed by the Pydantic
   output models is passed to the Gemini API via `GenerateContentConfig`. The
   API enforces this schema server-side and returns `response.parsed`, a fully
   typed Python object — eliminating hallucinated field names or type errors.

Caching
-------
Each function computes a SHA-256 hash of the serialised input payload. Identical
requests within the same server session are served from the in-memory cache in
database.py, skipping the API call entirely and saving latency and quota.
"""

import hashlib
import json
import os

from google import genai
from google.genai import types

from database import audit_log, reconciliation_cache, validation_cache
from models import (
    DataQualityRequest,
    DataQualityResponse,
    MedicationReconciliationRequest,
    MedicationReconciliationResponse,
)

MODEL = "gemini-2.5-flash"

client = genai.Client(api_key=os.environ["GEMINI_API_KEY"])


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _cache_key(data: dict) -> str:
    """Return a stable SHA-256 hex digest for an arbitrary dict."""
    serialised = json.dumps(data, sort_keys=True, default=str)
    return hashlib.sha256(serialised.encode()).hexdigest()


# ---------------------------------------------------------------------------
# Medication reconciliation
# ---------------------------------------------------------------------------

def reconcile_medications(
    data: MedicationReconciliationRequest,
) -> MedicationReconciliationResponse:
    """
    Reconcile conflicting medication records from multiple healthcare sources.

    Constructs a clinical pharmacist prompt, injects patient context and source
    records as structured JSON, and enforces a typed JSON response via
    response_schema so the output deserialises directly into
    MedicationReconciliationResponse without further parsing.
    """
    payload = data.model_dump()
    key = _cache_key(payload)

    if key in reconciliation_cache:
        audit_log.append({"endpoint": "reconcile", "cache_key": key, "cached": True})
        return MedicationReconciliationResponse(**reconciliation_cache[key])

    patient_json = json.dumps(payload["patient_context"], indent=2)
    sources_json = json.dumps(payload["sources"], indent=2)

    prompt = f"""You are an expert clinical pharmacist acting as a medication reconciliation engine.
Your task is to analyse conflicting medication records from multiple healthcare systems and determine the single most clinically accurate entry.

## Patient Context
{patient_json}

## Conflicting Medication Records
{sources_json}

## Instructions
1. Compare each source record, weighing its source_reliability score and last_updated recency.
2. Identify the most plausible medication name, dose, and frequency given the patient's age, active conditions, and recent lab values.
3. Flag any drug-condition contraindications, renal or hepatic dose-adjustment needs, or clinically significant interactions implied by the patient context.
4. Assign a confidence_score between 0.0 (no consensus, unreliable sources) and 1.0 (unanimous agreement across high-reliability sources).
5. List concrete recommended_actions for the care team if ambiguity or risk remains (e.g. "Confirm dose with prescribing physician", "Recheck eGFR before next dose").
6. Set clinical_safety_check.safe to false and populate warnings with plain-English descriptions if any safety concern is identified.

Return your analysis as a single structured JSON object matching the required schema exactly."""

    try:
        response = client.models.generate_content(
            model=MODEL,
            contents=prompt,
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
                response_schema=MedicationReconciliationResponse,
            ),
        )
        result: MedicationReconciliationResponse = response.parsed
        reconciliation_cache[key] = result.model_dump()
        audit_log.append({"endpoint": "reconcile", "cache_key": key, "cached": False})
        return result
    except Exception as exc:
        raise RuntimeError(f"Gemini reconciliation call failed: {exc}") from exc


# ---------------------------------------------------------------------------
# Data quality validation
# ---------------------------------------------------------------------------

def validate_data_quality(data: DataQualityRequest) -> DataQualityResponse:
    """
    Score the quality of a patient record across four clinical dimensions.

    Constructs a clinical data quality analyst prompt, injects the full patient
    record as structured JSON, and uses response_schema to enforce a typed JSON
    response matching DataQualityResponse directly.
    """
    payload = data.model_dump()
    key = _cache_key(payload)

    if key in validation_cache:
        audit_log.append({"endpoint": "validate", "cache_key": key, "cached": True})
        return DataQualityResponse(**validation_cache[key])

    record_json = json.dumps(payload, indent=2, default=str)

    prompt = f"""You are a senior clinical data quality analyst. Evaluate the patient record below and return a structured quality assessment.

## Patient Record
{record_json}

## Scoring Dimensions (each scored 0–100)

**Completeness (weight 30%)** — What percentage of clinically important fields are populated?
Consider: demographics (name, date_of_birth, gender), at least one medication entry with dose and frequency, any allergies or active conditions documented, and all core vital signs (blood_pressure, heart_rate, temperature, oxygen_saturation).

**Accuracy (weight 25%)** — Are field values internally consistent and correctly formatted?
Check: dates follow ISO-8601 (YYYY-MM-DD), blood_pressure follows "systolic/diastolic mmHg", medication doses include units, allergy severity uses standard terms (mild/moderate/severe/life-threatening).

**Timeliness (weight 20%)** — How recently was the record updated relative to today (2026-03-24)?
Score 100 if updated within 24 hours; scale linearly to 0 for records older than 365 days.

**Clinical Plausibility (weight 25%)** — Do values fall within clinically possible ranges?
Flag: heart_rate outside 20–300 bpm; oxygen_saturation outside 70–100 %; temperature outside 32–43 °C; blood pressure systolic outside 50–300 mmHg; negative or zero weight or height; medications listed as contraindicated for documented conditions.

## Instructions
1. Score each dimension independently from 0 to 100 using the criteria above.
2. Compute overall_score as the weighted average: completeness×0.30 + accuracy×0.25 + timeliness×0.20 + clinical_plausibility×0.25.
3. For every problem found, emit one entry in issues_detected with:
   - field: the exact model field name (e.g. "vital_signs.heart_rate", "demographics.date_of_birth")
   - issue: a concise, human-readable description of the problem
   - severity: "low" (minor/cosmetic), "medium" (incomplete but workable), or "high" (dangerous or unusable)
4. Be precise: missing optional fields are low-severity; clinically impossible vital signs or absent critical identifiers are high-severity.

Return your assessment as a single structured JSON object matching the required schema exactly."""

    try:
        response = client.models.generate_content(
            model=MODEL,
            contents=prompt,
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
                response_schema=DataQualityResponse,
            ),
        )
        result: DataQualityResponse = response.parsed
        validation_cache[key] = result.model_dump()
        audit_log.append({"endpoint": "validate", "cache_key": key, "cached": False})
        return result
    except Exception as exc:
        raise RuntimeError(f"Gemini validation call failed: {exc}") from exc
