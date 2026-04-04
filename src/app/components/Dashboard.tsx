import { StatsCard } from './StatsCard';
import { SpendingChart } from './SpendingChart';
import { BalanceChart } from './BalanceChart';
import { AIAnalysisPanel } from './AIAnalysisPanel';
import { TransactionList } from './TransactionList';

export function Dashboard() {
  return (
    <div className="size-full overflow-auto">
      <div className="min-h-full p-6">
        {/* Page title */}
        <div className="mb-8">
          <h2 className="text-2xl tracking-tight">Dashboard</h2>
          <p className="text-[#5a5a5a] text-sm mt-1">April 2026 · Sample Data</p>
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
    </div>
  );
}