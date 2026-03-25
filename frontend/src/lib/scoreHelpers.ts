export interface ScoreColors {
  ring: string;
  bg: string;
  text: string;
  badge: string;
  label: string;
}

export function scoreColor(score: number): ScoreColors {
  if (score >= 80) {
    return { ring: '#22c55e', bg: 'bg-emerald-50', text: 'text-emerald-700', badge: 'bg-emerald-100 text-emerald-800', label: 'Good' };
  }
  if (score >= 50) {
    return { ring: '#eab308', bg: 'bg-amber-50', text: 'text-amber-700', badge: 'bg-amber-100 text-amber-800', label: 'Fair' };
  }
  return { ring: '#ef4444', bg: 'bg-red-50', text: 'text-red-700', badge: 'bg-red-100 text-red-800', label: 'Poor' };
}

export function confidenceColor(score: number): ScoreColors {
  return scoreColor(score * 100);
}
