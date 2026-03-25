import { ReactNode } from 'react';

interface Props {
  icon: ReactNode;
  message: string;
}

export default function EmptyState({ icon, message }: Props) {
  return (
    <div className="flex flex-col items-center justify-center h-full text-slate-400 gap-3 py-16">
      {icon}
      <p className="text-sm">{message}</p>
    </div>
  );
}
