import { useTransactions } from '../hooks/useTransactions';
import { StatsCard } from './StatsCard';
import { SpendingChart } from './SpendingChart';
import { BalanceChart } from './BalanceChart';
import { TransactionList } from './TransactionList';

export function Dashboard() {
  const transactions = useTransactions();
  const hasData = transactions.length > 0;

  // Stats
  const income = transactions
    .filter(t => t.type === 'credit')
    .reduce((s, t) => s + t.amount, 0);

  const expenses = transactions
    .filter(t => t.type === 'debit')
    .reduce((s, t) => s + t.amount, 0);

  const net = income - expenses;
  const savingsRate = income > 0 ? ((net / income) * 100).toFixed(1) : '0.0';

  const fmt = (n: number) =>
    '$' + n.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 });

  return (
    <div className="size-full overflow-auto">
      <div className="min-h-full p-6">
        {/* Page title */}
        <div className="mb-8">
          <h2 className="text-2xl tracking-tight">Dashboard</h2>
          <p className="text-[#5a5a5a] text-sm mt-1">
            April 2026 · {hasData ? `${transactions.length} transactions` : 'Sample Data'}
          </p>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <StatsCard label="Income"       value={hasData ? fmt(income)   : '$8,450'}  trend="+12%" color="green"  />
          <StatsCard label="Spent"        value={hasData ? fmt(expenses) : '$6,234'}  trend="+8%"  color="red"    />
          <StatsCard label="Net"          value={hasData ? fmt(net)      : '$2,216'}  trend="+45%" color="green"  />
          <StatsCard label="Savings Rate" value={hasData ? `${savingsRate}%` : '26.2%'} trend="+3%" color="yellow" />
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <SpendingChart transactions={hasData ? transactions : undefined} />
          <BalanceChart  transactions={hasData ? transactions : undefined} />
        </div>

        {/* Transaction List */}
        <TransactionList transactions={hasData ? transactions : undefined} />
      </div>
    </div>
  );
}