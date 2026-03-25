import { ReactNode } from 'react';

interface Props {
  title: string;
  subtitle: string;
  children: ReactNode;
}

export default function ResultCard({ title, subtitle, children }: Props) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col h-[680px]">
      <div className="px-6 py-4 border-b border-slate-100">
        <h2 className="font-semibold text-slate-900">{title}</h2>
        <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>
      </div>
      <div className="p-6 flex-1 overflow-y-auto">
        {children}
      </div>
    </div>
  );
}
