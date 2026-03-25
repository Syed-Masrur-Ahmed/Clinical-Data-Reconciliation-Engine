'use client';

import { ReconcileResponse } from '@/lib/types';
import { confidenceColor } from '@/lib/scoreHelpers';
import RingChart from './RingChart';
import EmptyState from './EmptyState';
import ResultCard from './ResultCard';
import ErrorAlert from './ErrorAlert';

interface Props {
  data: ReconcileResponse | null;
  error: string | null;
  loading: boolean;
  decision: 'approve' | 'reject' | null;
  onDecision: (d: 'approve' | 'reject') => void;
}

const DECISION_CONFIG = {
  approve: {
    bg: 'bg-emerald-50 border-emerald-200 text-emerald-800',
    iconColor: 'text-emerald-600',
    iconPath: 'M5 13l4 4L19 7',
    message: 'Recommendation approved and ready for EHR update.',
  },
  reject: {
    bg: 'bg-red-50 border-red-200 text-red-800',
    iconColor: 'text-red-600',
    iconPath: 'M6 18L18 6M6 6l12 12',
    message: 'Recommendation rejected. Manual review required.',
  },
};

export default function ReconcileResult({ data, error, loading, decision, onDecision }: Props) {
  return (
    <ResultCard title="Reconciliation Result" subtitle="AI-generated clinical recommendation">
      {!data && !error && !loading && (
        <EmptyState
          icon={
            <svg className="w-12 h-12 text-slate-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          }
          message="Submit a payload to see the reconciled result"
        />
      )}

      {error && <ErrorAlert message={error} />}

      {data && (
        <div className="fade-in flex flex-col gap-5">
          {/* Confidence + reconciled medication */}
          {(() => {
            const pct = Math.round(data.confidence_score * 100);
            const c = confidenceColor(data.confidence_score);
            return (
              <div className={`flex gap-4 items-center ${c.bg} rounded-xl p-4 border border-slate-100`}>
                <RingChart score={pct} color={c.ring} size={72} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Confidence</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${c.badge}`}>{c.label}</span>
                  </div>
                  <p className="text-sm font-bold text-slate-900 leading-snug">{data.reconciled_medication}</p>
                </div>
              </div>
            );
          })()}

          {/* Safety check */}
          {(() => {
            const safe = data.clinical_safety_check?.safe;
            const warnings = data.clinical_safety_check?.warnings ?? [];
            return (
              <div className={`${safe ? 'bg-emerald-50 border-emerald-200' : 'bg-amber-50 border-amber-200'} border rounded-xl p-4`}>
                <div className="flex items-center gap-2 mb-2">
                  <svg className={`w-4 h-4 ${safe ? 'text-emerald-600' : 'text-amber-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d={safe
                        ? 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z'
                        : 'M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z'}
                    />
                  </svg>
                  <span className={`text-sm font-semibold ${safe ? 'text-emerald-800' : 'text-amber-800'}`}>
                    {safe ? 'Safety Check Passed' : 'Safety Warnings'}
                  </span>
                </div>
                <ul className={`text-xs ${safe ? 'text-emerald-700' : 'text-amber-800'} space-y-1 pl-1`}>
                  {warnings.length > 0
                    ? warnings.map((w, i) => (
                        <li key={i} className="flex gap-2 items-start">
                          {!safe && (
                            <svg className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                            </svg>
                          )}
                          <span>{w}</span>
                        </li>
                      ))
                    : <li>No safety warnings detected.</li>
                  }
                </ul>
              </div>
            );
          })()}

          {/* Clinical reasoning */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-2">Clinical Reasoning</h3>
            <p className="text-sm text-slate-700 leading-relaxed bg-slate-50 rounded-lg p-3 border border-slate-100">
              {data.reasoning}
            </p>
          </div>

          {/* Recommended actions */}
          {data.recommended_actions?.length > 0 && (
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-2">Recommended Actions</h3>
              <ul className="text-sm text-slate-700 space-y-2 bg-slate-50 rounded-lg p-3 border border-slate-100">
                {data.recommended_actions.map((a, i) => (
                  <li key={i} className="flex gap-2 items-start">
                    <span className="w-5 h-5 bg-blue-100 text-blue-700 rounded-full text-xs flex items-center justify-center flex-shrink-0 font-semibold mt-0.5">
                      {i + 1}
                    </span>
                    <span>{a}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Approve / Reject */}
          <div className="flex gap-3 pt-1">
            <button
              onClick={() => onDecision('approve')}
              className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2 text-sm"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Approve
            </button>
            <button
              onClick={() => onDecision('reject')}
              className="flex-1 bg-slate-100 hover:bg-red-50 text-slate-700 hover:text-red-700 border border-slate-200 hover:border-red-200 font-medium py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2 text-sm"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              Reject
            </button>
          </div>

          {/* Decision banner */}
          {decision && (() => {
            const cfg = DECISION_CONFIG[decision];
            return (
              <div className={`fade-in border rounded-lg px-4 py-3 text-sm font-medium flex items-center gap-2 ${cfg.bg}`}>
                <svg className={`w-4 h-4 ${cfg.iconColor}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={cfg.iconPath} />
                </svg>
                {cfg.message}
              </div>
            );
          })()}
        </div>
      )}
    </ResultCard>
  );
}
