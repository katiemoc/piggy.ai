import { useState } from 'react';
import { StatsCard } from './StatsCard';
import { SpendingChart } from './SpendingChart';
import { BalanceChart } from './BalanceChart';
import { AIAnalysisPanel } from './AIAnalysisPanel';
import { TransactionList } from './TransactionList';
import { GatherStatements } from './GatherStatements';

export function Dashboard() {
  const [showGather, setShowGather] = useState(false);

  return (
    <div className="size-full overflow-auto">
      <div className="min-h-full p-6">
        {/* Page title */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-2xl tracking-tight">Dashboard</h2>
            <p className="text-[#5a5a5a] text-sm mt-1">April 2026 · Sample Data</p>
          </div>
          <button
            onClick={() => setShowGather(true)}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#57886c] px-5 py-3 text-sm font-medium text-white hover:bg-[#466060] transition-colors"
          >
            ⚡ Gather Finance Statements
          </button>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <StatsCard label="Income" value="$8,450" trend="+12%" color="green" />
          <StatsCard label="Spent" value="$6,234" trend="+8%" color="red" />
          <StatsCard label="Net" value="$2,216" trend="+45%" color="green" />
          <StatsCard label="Savings Rate" value="26.2%" trend="+3%" color="yellow" />
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <SpendingChart />
          <BalanceChart />
        </div>

        {/* AI Analysis Panel */}
        <AIAnalysisPanel />

        {/* Transaction List */}
        <TransactionList />
      </div>

      {showGather && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <GatherStatements
            onClose={() => setShowGather(false)}
            onComplete={() => setShowGather(false)}
          />
        </div>
      )}
    </div>
  );
}