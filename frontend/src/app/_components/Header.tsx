'use client';

import Image from 'next/image';
import { useApiKey } from '@/context/ApiKeyContext';

const statusDotClass: Record<string, string> = {
  idle:  'bg-slate-300',
  ok:    'bg-emerald-500',
  error: 'bg-red-500',
};

const statusDotTitle: Record<string, string> = {
  idle:  'Not connected',
  ok:    'Connected',
  error: 'Error',
};

export default function Header() {
  const { apiKey, setApiKey, connectionStatus } = useApiKey();

  return (
    <header className="bg-white border-b border-slate-200 shadow-sm sticky top-0 z-10">
      <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Image src="/logo.png" alt="logo" width={32} height={32} className="rounded-md" />
          <div>
            <h1 className="text-lg font-semibold text-slate-900 leading-none">MediCheck</h1>
            <p className="text-xs text-slate-500 mt-0.5">AI-powered medication reconciliation &amp; data quality validation</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <input
            type="password"
            value={apiKey}
            onChange={e => setApiKey(e.target.value)}
            placeholder="API Key"
            className="text-xs border border-slate-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent w-40 bg-slate-50"
          />
          <div
            className={`w-2.5 h-2.5 rounded-full ${statusDotClass[connectionStatus]}`}
            title={statusDotTitle[connectionStatus]}
          />
        </div>
      </div>
    </header>
  );
}
