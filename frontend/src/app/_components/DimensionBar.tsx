import { scoreColor } from '@/lib/scoreHelpers';

interface Props {
  label: string;
  score: number;
}

export default function DimensionBar({ label, score }: Props) {
  const c = scoreColor(score);
  const pct = Math.round(score);

  return (
    <div>
      <div className="flex justify-between items-center mb-1">
        <span className="text-xs font-medium text-slate-600">{label}</span>
        <span className={`text-xs font-semibold ${c.text}`}>
          {pct}<span className="font-normal text-slate-400">/100</span>
        </span>
      </div>
      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${pct}%`, backgroundColor: c.ring }}
        />
      </div>
    </div>
  );
}
