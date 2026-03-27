import { ReconcileRequest, ReconcileResponse, ValidateRequest, ValidateResponse } from './types';

export function pingBackend(): void {
  fetch('/health').catch(() => {/* ignore — just waking up the server */});
}

async function callApi<T>(path: string, body: unknown, apiKey: string): Promise<T> {
  if (!apiKey) throw new Error('Enter your API key in the header before submitting.');

  const res = await fetch(path, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-API-Key': apiKey,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail || `HTTP ${res.status}`);
  }

  return res.json();
}

export function parseJsonInput(raw: string): unknown {
  if (!raw.trim()) throw new Error('Payload is empty.');
  try { return JSON.parse(raw); }
  catch { throw new Error('Invalid JSON — please check your payload.'); }
}

export function reconcileMedication(body: ReconcileRequest, apiKey: string): Promise<ReconcileResponse> {
  return callApi<ReconcileResponse>('/api/reconcile/medication', body, apiKey);
}

export function validateDataQuality(body: ValidateRequest, apiKey: string): Promise<ValidateResponse> {
  return callApi<ValidateResponse>('/api/validate/data-quality', body, apiKey);
}
