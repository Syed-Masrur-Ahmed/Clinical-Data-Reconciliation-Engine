interface Props {
  score: number; // 0–100
  color: string;
  size?: number;
}

export default function RingChart({ score, color, size = 80 }: Props) {
  const r = 28;
  const circ = 2 * Math.PI * r;
  const offset = circ - (score / 100) * circ;

  return (
    <svg width={size} height={size} viewBox="0 0 64 64" className="flex-shrink-0">
      <circle cx="32" cy="32" r={r} fill="none" stroke="#e2e8f0" strokeWidth="6" />
      <circle
        cx="32" cy="32" r={r}
        fill="none"
        stroke={color}
        strokeWidth="6"
        strokeDasharray={circ}
        strokeDashoffset={offset}
        strokeLinecap="round"
        transform="rotate(-90 32 32)"
        className="score-ring"
      />
      <text x="32" y="36" textAnchor="middle" fontSize="12" fontWeight="700" fill={color}>
        {Math.round(score)}
      </text>
    </svg>
  );
}
