'use client';

import { useState } from 'react';
import { useApiKey } from '@/context/ApiKeyContext';
import { reconcileMedication, parseJsonInput } from '@/lib/api';
import { ReconcileRequest, ReconcileResponse } from '@/lib/types';
import { RECONCILE_SAMPLE } from '@/lib/fixtures';
import JsonInputCard from './JsonInputCard';
import ReconcileResult from './ReconcileResult';

export default function ReconcilePanel() {
  const { apiKey, setConnectionStatus } = useApiKey();
  const [input, setInput] = useState('');
  const [result, setResult] = useState<ReconcileResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [decision, setDecision] = useState<'approve' | 'reject' | null>(null);

  async function handleSubmit() {
    let body;
    try {
      body = parseJsonInput(input);
    } catch (e: unknown) {
      setError((e as Error).message);
      setResult(null);
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);
    setDecision(null);

    try {
      const data = await reconcileMedication(body as ReconcileRequest, apiKey);
      setResult(data);
      setConnectionStatus('ok');
    } catch (e: unknown) {
      setError((e as Error).message);
      setConnectionStatus('error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
      <JsonInputCard
        title="Conflicting Medication Records"
        subtitle="POST /api/reconcile/medication"
        placeholder={'Paste JSON payload here or click "Load sample" above…'}
        value={input}
        onChange={setInput}
        onSubmit={handleSubmit}
        onLoadSample={() => setInput(JSON.stringify(RECONCILE_SAMPLE, null, 2))}
        loading={loading}
        submitLabel="Reconcile Medications"
        submitIcon={
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        }
      />
      <ReconcileResult
        data={result}
        error={error}
        loading={loading}
        decision={decision}
        onDecision={setDecision}
      />
    </div>
  );
}
