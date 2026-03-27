# Architecture: Clinical Data Reconciliation Engine

## Overview

The system follows a clean three-tier architecture: a **Next.js + Tailwind frontend**, a **FastAPI backend**, and **Google Gemini** as the inference layer. Concerns are separated strictly across files: routing lives in `main.py`, schema validation in `models.py`, and all LLM interaction in `ai_service.py`, so each layer can be tested or swapped independently.

---

## Technology Choices

### FastAPI (Backend)

FastAPI was chosen over Flask or Django REST Framework for three concrete reasons:

1. **Native async support**: Gemini API calls are I/O-bound; async route handlers avoid blocking the event loop and allow concurrent requests without extra threading overhead.
2. **Pydantic-first**: FastAPI treats Pydantic models as first-class citizens. Request bodies are validated, coerced, and documented automatically; no separate serializer layer is needed.
3. **Auto-generated OpenAPI docs**: `/docs` is available out of the box, which is useful for manual testing against live endpoints without a separate tool.

### Tailwind CSS + Next.js (Frontend)

Tailwind was chosen by following the assessment instructions.

Next.js was selected because its App Router provides file-based routing, React Server Components for layout, and built-in TypeScript support — all without additional configuration.

---

## Prompt Engineering

Both endpoints use the same strategy: **role-priming + structured context injection + schema-enforced output**.

### Role Priming

Each prompt opens with an explicit persona assignment:

- Medication reconciliation → *"You are an expert clinical pharmacist..."*
- Data quality validation → *"You are a senior clinical data quality analyst..."*

This anchors the model's reasoning style to the clinical domain before it sees any data.

### Structured Context Injection

The raw request payload is serialized as indented JSON and embedded verbatim in the prompt. This avoids lossy natural-language paraphrasing of clinical data (e.g., conflating dosage units, dropping timestamp precision).

### Schema-Enforced Output

The Gemini SDK's `response_schema` parameter is set to the corresponding Pydantic model. Gemini's server-side constrained decoding guarantees that `response.parsed` is a fully typed Python object — eliminating post-hoc JSON parsing, regex cleanup, or hallucinated field names.

### Medication Reconciliation Specifics

The prompt instructs the model to weight sources by:
- `reliability_score` (explicit float or mapped string: low=0.3, medium=0.6, high=0.9)
- Recency (`last_updated` or `last_filled` timestamps)
- Consensus across sources (majority agreement raises confidence)

It then checks for drug-condition contraindications, renal/hepatic adjustment needs, and inter-source dose conflicts before assigning a `confidence_score` (0.0–1.0).

### Data Quality Validation Specifics

The model scores four independently weighted dimensions:

| Dimension | Weight | Key Criteria |
|---|---|---|
| Completeness | 30% | % of clinically important fields populated |
| Accuracy | 25% | Date formats (ISO-8601), BP format ("systolic/diastolic mmHg"), internal consistency |
| Timeliness | 20% | Days since `last_updated` (100 if ≤24h, decays linearly to 0 at 365 days) |
| Clinical Plausibility | 25% | Vital sign range checks (HR 20–300 bpm, SpO2 70–100%, temp 32–43°C, etc.) |

The overall score is the weighted average of these four dimensions.

---

## Caching

Every request payload is hashed (SHA-256) before hitting the LLM. Identical payloads are served from an in-memory dict — `reconciliation_cache` and `validation_cache` in `database.py` — with no API call. An audit log records each request's cache key and hit/miss status for debugging. Cache is session-scoped (cleared on server restart), which is appropriate for an in-memory system.

---

## Authentication

All POST endpoints require a valid `X-API-Key` header. The key is compared against the `API_KEY` environment variable via a FastAPI dependency (`require_api_key`). Missing or incorrect keys return 401/403 before any business logic runs. The frontend stores the key in React context (never localStorage) and attaches it to every request header.

---

## Edge Case Handling

| Scenario | Handling |
|---|---|
| Single medication source submitted | Pydantic `min_length=2` on the sources list → 422 before LLM call |
| Missing required fields (e.g., `vital_signs`) | Pydantic validation → 422 Unprocessable Entity |
| Gemini API timeout or error | `try/except` in `ai_service.py` raises `HTTPException(502)` with a descriptive message |
| Invalid JSON in frontend input | `parseJsonInput()` catches `SyntaxError` and surfaces an inline error alert |
| Ambiguous reliability score format | Pydantic validator accepts both float (0.0–1.0) and string ("low"/"medium"/"high") and normalises to float |
| Duplicate requests under load | SHA-256 cache deduplicates identical concurrent payloads |
| Missing timestamps on medication source | Pydantic validator requires at least one of `last_updated` or `last_filled` to be present |
