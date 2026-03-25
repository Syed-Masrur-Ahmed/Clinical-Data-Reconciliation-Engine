interface Props {
  message: string;
}

export default function ErrorAlert({ message }: Props) {
  return (
    <div className="fade-in bg-red-50 border border-red-200 rounded-lg p-4 flex gap-3">
      <svg className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      <div>
        <p className="font-medium text-red-800 text-sm">Request failed</p>
        <p className="text-red-700 text-xs mt-1">{message}</p>
      </div>
    </div>
  );
}
