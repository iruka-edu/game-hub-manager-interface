'use client';

import Link from 'next/link';

interface GameDetailTabsProps {
  gameId: string;
  currentTab: string;
  historyCount: number;
  qcReportsCount: number;
}

export function GameDetailTabs({ gameId, currentTab, historyCount, qcReportsCount }: GameDetailTabsProps) {
  const tabs = [
    { id: 'info', label: 'Thông tin', count: null },
    { id: 'history', label: 'Lịch sử', count: historyCount },
    { id: 'qc', label: 'QC Reports', count: qcReportsCount },
  ];

  return (
    <div className="bg-white rounded-xl border border-slate-200">
      <div className="flex border-b border-slate-200">
        {tabs.map((tab) => (
          <Link
            key={tab.id}
            href={`/console/games/${gameId}?tab=${tab.id}`}
            className={`px-6 py-3 text-sm font-medium border-b-2 -mb-px ${
              currentTab === tab.id
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            {tab.label}
            {tab.count !== null && ` (${tab.count})`}
          </Link>
        ))}
      </div>
    </div>
  );
}
