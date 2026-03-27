# MediCheck

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
