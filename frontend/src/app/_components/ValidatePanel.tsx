'use client';

import { useState } from 'react';
import { useApiKey } from '@/context/ApiKeyContext';
import { validateDataQuality, parseJsonInput } from '@/lib/api';
import { ValidateRequest, ValidateResponse } from '@/lib/types';
import { VALIDATE_SAMPLE } from '@/lib/fixtures';
import JsonInputCard from './JsonInputCard';
import ValidateResult from './ValidateResult';

export default function ValidatePanel() {
  const { apiKey, setConnectionStatus } = useApiKey();
  const [input, setInput] = useState('');
  const [result, setResult] = useState<ValidateResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

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

    try {
      const data = await validateDataQuality(body as ValidateRequest, apiKey);
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
        title="Patient Record"
        subtitle="POST /api/validate/data-quality"
        placeholder={'Paste JSON payload here or click "Load sample" above…'}
        value={input}
        onChange={setInput}
        onSubmit={handleSubmit}
        onLoadSample={() => setInput(JSON.stringify(VALIDATE_SAMPLE, null, 2))}
        loading={loading}
        submitLabel="Validate Data Quality"
        submitIcon={
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        }
      />
      <ValidateResult data={result} error={error} loading={loading} />
    </div>
  );
}
