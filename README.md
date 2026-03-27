# MediCheck

**Live at: https://medicheck-platform.vercel.app/**  
(get API key by reaching out to syed.masrur.ahmed.28@dartmouth.edu)

**Backend deployed at https://medicheck-1iz6.onrender.com**  
(check https://medicheck-1iz6.onrender.com/health to see if it's running!)

A full-stack mini application that uses an LLM to reconcile conflicting patient medication records and evaluate clinical data quality. Built with FastAPI, Next.js, Tailwind CSS, and Google Gemini.

---

## Setup (Local)

### Prerequisites

- Python 3.10+
- Node.js 18+
- A Google Gemini API key (free tier available at [aistudio.google.com](https://aistudio.google.com))

### 1. Clone the Repository

```bash
git clone <repo-url>
cd Clinical-Data-Reconciliation-Engine
```

### 2. Environment Variables

```bash
cp .env.example .env
```

Then open `.env` and fill in your keys:

```env
GEMINI_API_KEY=your-google-gemini-api-key
API_KEY=any-secret-string-you-choose
NEXT_PUBLIC_API_URL=http://localhost:8000   # no change needed for local dev
```

The `API_KEY` value is what you paste into the "API Key" field in the UI header. It authenticates all requests to the backend. Both the backend and frontend read from this single `.env` file.

### 3. Backend

```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload
# Backend runs at http://localhost:8000
# Interactive API docs at http://localhost:8000/docs
```

### 4. Frontend

```bash
cd frontend
npm install
npm run dev
# Frontend runs at http://localhost:3000
```

### 5. Run Tests

```bash
# From project root
pytest
```

There are also some test data files in `tests/fixtures` which you can copy/paste into the frontend.

---

## LLM Choice: Google Gemini 2.5 Flash

**Model:** `gemini-2.5-flash`
**SDK:** `google-genai` (Python)

### Why Gemini?

1. **Structured JSON output with server-side schema enforcement**: The `google-genai` SDK accepts a Pydantic model as `response_schema`. Gemini's constrained decoding produces a fully typed Python object directly from `response.parsed`, with no post-hoc JSON parsing or regex cleanup. This is the single most important reason for this choice: clinical data cannot tolerate hallucinated field names or malformed outputs.

2. **Generous free tier**: Gemini 2.5 Flash provides a substantial free quota (requests per minute and per day) on Google AI Studio with no billing setup required. This made rapid iteration and testing practical without credit concerns.

3. **Speed**: Flash-tier models are optimised for low latency. For a clinician-facing tool where reconciliation results are awaited synchronously, response time matters.

4. **Large context window**: Gemini 2.5 Flash supports up to 1M tokens, which comfortably accommodates large patient records with many medication sources, lab results, and clinical notes injected verbatim into the prompt.

---

## API Endpoints

| Method | Path | Description |
|---|---|---|
| GET | `/health` | Health check |
| POST | `/api/reconcile/medication` | Reconcile conflicting medication records |
| POST | `/api/validate/data-quality` | Score a patient record across 4 quality dimensions |

All POST endpoints require an `X-API-Key` header matching the `API_KEY` environment variable.

---

## Key Design Decisions and Trade-offs

### 1. Schema-Enforced LLM Output (Constrained Decoding)
**Decision:** Pass Pydantic models directly as `response_schema` to the Gemini SDK rather than prompting the model to "return JSON" and parsing the string output.

**Trade-off:** This ties the application to the Gemini SDK's structured output feature specifically. Switching to a different provider (e.g., Claude, GPT-4o) would require reworking the output contract. That said, the reliability gain is non-negotiable in a clinical context: hallucinated field names or subtly malformed JSON would silently corrupt downstream logic, which is unacceptable for patient safety.

---

### 2. Verbatim JSON Injection into Prompts
**Decision:** Serialize the full request payload as indented JSON and embed it literally in the prompt, rather than paraphrasing it in natural language.

**Trade-off:** Prompts are longer and consume more tokens. However, natural-language paraphrasing of clinical data (doses, frequencies, timestamps) introduces lossy summarization. The model reasons over your summary, not the source data. For medication reconciliation, where a "500 mg" vs "50 mg" distinction can be life-critical, verbatim injection is the safer default.

---

### 3. In-Memory Caching with SHA-256 Payload Hashing
**Decision:** Hash each request payload and serve identical requests from an in-memory cache, bypassing the LLM entirely on cache hits.

**Trade-off:** The cache does not survive server restarts and is not shared across instances, making it unsuitable for multi-replica deployments. For this scope (single-server, demo-scale), it meaningfully reduces API quota consumption and latency. A Redis layer would be the production upgrade path.

---

### 4. Rule-Based Data Quality Scoring (No LLM)
**Decision:** The timeliness and completeness dimensions of `/api/validate/data-quality` are computed with deterministic rules (field presence checks, timestamp math, vital sign range validation). Only clinical plausibility uses the LLM.

**Trade-off:** Rule-based scoring is fast, cheap, and fully explainable. You can point to exactly which field caused a score deduction. A fully LLM-driven quality score would be richer but non-deterministic, expensive, and harder to audit. In regulated healthcare environments, explainability and reproducibility outweigh model sophistication.

---

### 5. API Key Authentication (Not OAuth2)
**Decision:** All POST endpoints are protected by a shared secret passed as an `X-API-Key` header.

**Trade-off:** A single shared key is easy to set up and sufficient for a demo, but it provides no per-user identity, no token expiry, and no revocation granularity. In a real clinical deployment, OAuth2/OIDC with role-based access control would be required for HIPAA compliance. This was an explicit scope trade-off documented in "What I Would Improve."

---

## What I Would Improve With More Time

### Engineering

- **Persistent storage**: Replace the in-memory dicts with a lightweight embedded database (e.g., SQLite via SQLModel) so audit logs and cached results survive server restarts.
- **Streaming responses**: Stream Gemini output tokens to the frontend so clinicians see reasoning appear incrementally rather than waiting for the full response.
- **Rate limiting**: Add per-key rate limiting middleware to prevent abuse of the Gemini quota.
- **Async Gemini client**: The current implementation calls the Gemini SDK synchronously inside an async route handler. Wrapping it with `asyncio.to_thread()` or switching to the async client would prevent blocking the event loop under load.
- **Docker Compose**: Package backend and frontend together so the entire stack starts with one command.

### Clinical Logic

- **Drug interaction database**: Supplement the LLM's reasoning with a structured drug-drug interaction lookup (e.g., RxNorm / OpenFDA API) to catch interactions the model might miss or hallucinate.
- **Confidence calibration**: Run the reconciliation prompt multiple times with temperature > 0 and use ensemble agreement to produce a statistically calibrated confidence score rather than a single-shot estimate.
- **Timeliness decay curve**: The current timeliness score uses a linear decay to zero at 365 days. A clinical domain expert should define the appropriate decay function (e.g., exponential, stepped by record type).
- **Audit trail**: Persist the full reconciliation decision log (including which clinician approved/rejected and when) for regulatory compliance.

### Frontend

- **Authentication**: Replace the bare API key input with a proper login flow (OAuth2 / SSO) appropriate for a healthcare setting.
- **Accessibility**: Add ARIA labels and keyboard navigation to meet WCAG 2.1 AA for clinical software.
- **History panel**: Show the last N reconciliation and validation results within the session.

---

## Estimated Time Spent

| Area | Hours |
|---|---|
| Backend (FastAPI, models, AI service) | 2 |
| Prompt engineering & iteration | 1 |
| Frontend (Next.js, components, UI) | 2 |
| Testing | 1 |
| Documentation | 1 |
| **Total** | **7** |

---

## Project Structure

```
.
├── backend/
│   ├── main.py          # FastAPI routing & auth
│   ├── models.py        # Pydantic request/response schemas
│   ├── ai_service.py    # Gemini integration & prompt engineering
│   ├── database.py      # In-memory cache & audit log
│   └── requirements.txt
├── frontend/
│   └── src/
│       ├── app/         # Next.js App Router pages & layouts
│       ├── context/     # Global API key state
│       └── lib/         # API client, types, fixtures, helpers
├── tests/
│   └── test_main.py     # 7 unit tests (LLM calls mocked)
├── architecture.md      # Design decisions & prompt engineering notes
├── .env.example
└── README.md
```
