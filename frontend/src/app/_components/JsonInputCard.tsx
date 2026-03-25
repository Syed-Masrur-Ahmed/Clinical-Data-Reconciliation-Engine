'use client';

import { ReactNode } from 'react';

interface Props {
  title: string;
  subtitle: string;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  onSubmit: () => void;
  onLoadSample: () => void;
  loading: boolean;
  submitLabel: string;
  submitIcon: ReactNode;
}

export default function JsonInputCard({
  title, subtitle, placeholder, value, onChange,
  onSubmit, onLoadSample, loading, submitLabel, submitIcon,
}: Props) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col h-[680px]">
      <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
        <div>
          <h2 className="font-semibold text-slate-900">{title}</h2>
          <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>
        </div>
        <button
          onClick={onLoadSample}
          className="text-xs text-blue-600 hover:text-blue-800 font-medium underline underline-offset-2"
        >
          Load sample
        </button>
      </div>
      <div className="p-6 flex-1 flex flex-col gap-4">
        <textarea
          rows={22}
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full flex-1 text-xs bg-slate-50 border border-slate-200 rounded-lg p-3 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent leading-relaxed"
        />
        <button
          onClick={onSubmit}
          disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
        >
          {loading ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full spinner" />
              Processing…
            </>
          ) : (
            <>
              {submitIcon}
              {submitLabel}
            </>
          )}
        </button>
      </div>
    </div>
  );
}
