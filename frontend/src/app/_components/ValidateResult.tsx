'use client';

import { ValidateResponse } from '@/lib/types';
import { scoreColor } from '@/lib/scoreHelpers';
import RingChart from './RingChart';
import DimensionBar from './DimensionBar';
import EmptyState from './EmptyState';
import ResultCard from './ResultCard';
import ErrorAlert from './ErrorAlert';

interface Props {
  data: ValidateResponse | null;
  error: string | null;
  loading: boolean;
}

const severityStyle: Record<string, string> = {
  high:   'bg-red-100 text-red-800',
  medium: 'bg-amber-100 text-amber-800',
  low:    'bg-slate-100 text-slate-700',
};

export default function ValidateResult({ data, error, loading }: Props) {
  return (
    <ResultCard title="Data Quality Report" subtitle="Scored across four clinical dimensions">
      {!data && !error && !loading && (
        <EmptyState
          icon={
            <svg className="w-12 h-12 text-slate-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          }
          message="Submit a payload to see the quality report"
        />
      )}

      {error && <ErrorAlert message={error} />}

      {data && (() => {
        const overall = Math.round(data.overall_score);
        const c = scoreColor(overall);
        const bd = data.breakdown;
        return (
          <div className="fade-in flex flex-col gap-5">
            {/* Overall score */}
            <div className={`flex gap-5 items-center ${c.bg} rounded-xl p-5 border border-slate-100`}>
              <RingChart score={overall} color={c.ring} size={88} />
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-1">Overall Data Quality</p>
                <p className={`text-3xl font-bold ${c.text}`}>
                  {overall}<span className="text-base font-normal text-slate-400">/100</span>
                </p>
                <span className={`inline-block mt-1 text-xs px-2.5 py-1 rounded-full font-semibold ${c.badge}`}>{c.label}</span>
              </div>
            </div>

            {/* Dimension breakdown */}
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 space-y-3">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-3">Quality Dimensions</h3>
              <DimensionBar label="Completeness" score={bd.completeness} />
              <DimensionBar label="Accuracy" score={bd.accuracy} />
              <DimensionBar label="Timeliness" score={bd.timeliness} />
              <DimensionBar label="Clinical Plausibility" score={bd.clinical_plausibility} />
            </div>

            {/* Issues */}
            {data.issues_detected?.length > 0 ? (
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-2">
                  Detected Issues
                  <span className="ml-2 bg-slate-200 text-slate-600 rounded-full px-2 py-0.5 font-medium">
                    {data.issues_detected.length}
                  </span>
                </h3>
                <div className="overflow-x-auto rounded-lg border border-slate-100">
                  <table className="w-full text-left bg-white">
                    <thead>
                      <tr className="bg-slate-50 text-xs text-slate-500 font-semibold uppercase tracking-wide">
                        <th className="py-2 px-3">Field</th>
                        <th className="py-2 px-3">Issue</th>
                        <th className="py-2 px-3">Severity</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.issues_detected.map((issue, i) => (
                        <tr key={i} className="border-t border-slate-100 hover:bg-slate-50">
                          <td className="py-2 pr-4 px-3 text-xs font-mono text-blue-700">{issue.field}</td>
                          <td className="py-2 pr-4 px-3 text-xs text-slate-700">{issue.issue}</td>
                          <td className="py-2 px-3 text-xs">
                            <span className={`px-2 py-0.5 rounded-full font-semibold ${severityStyle[issue.severity] ?? severityStyle.low}`}>
                              {issue.severity}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className="bg-emerald-50 border border-emerald-200 rounded-lg px-4 py-3 text-sm text-emerald-800 font-medium flex items-center gap-2">
                <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                No data quality issues detected.
              </div>
            )}
          </div>
        );
      })()}
    </ResultCard>
  );
}
