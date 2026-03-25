'use client';

import { useState } from 'react';
import Header from './_components/Header';
import TabBar from './_components/TabBar';
import ReconcilePanel from './_components/ReconcilePanel';
import ValidatePanel from './_components/ValidatePanel';
import { Tab } from '@/lib/types';

export default function Home() {
  const [activeTab, setActiveTab] = useState<Tab>('reconcile');

  return (
    <div className="bg-slate-50/20 min-h-screen text-slate-800">
      <Header />
      <div className="max-w-5xl mx-auto px-6 pt-5">
        <TabBar activeTab={activeTab} onTabChange={setActiveTab} />
      </div>
      <main className="max-w-5xl mx-auto px-6 py-5">
        {activeTab === 'reconcile' ? <ReconcilePanel /> : <ValidatePanel />}
      </main>
    </div>
  );
}
