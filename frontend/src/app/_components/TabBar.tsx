import { Tab } from '@/lib/types';

interface Props {
  activeTab: Tab;
  onTabChange: (tab: Tab) => void;
}

export default function TabBar({ activeTab, onTabChange }: Props) {
  const tabClass = (tab: Tab) =>
    tab === activeTab
      ? 'bg-blue-600 text-white shadow-sm px-5 py-2 rounded-lg text-sm font-medium transition-all'
      : 'text-slate-500 hover:text-slate-700 px-5 py-2 rounded-lg text-sm font-medium transition-all';

  return (
    <div className="flex gap-1 bg-white border border-slate-200 rounded-xl p-1 w-fit shadow-sm">
      <button className={tabClass('reconcile')} onClick={() => onTabChange('reconcile')}>
        Medication Reconciliation
      </button>
      <button className={tabClass('validate')} onClick={() => onTabChange('validate')}>
        Data Quality Validation
      </button>
    </div>
  );
}
