import { useTransactions } from '../hooks/useTransactions';
import { StatsCard } from './StatsCard';
import { SpendingChart } from './SpendingChart';
import { BalanceChart } from './BalanceChart';
import { TransactionList } from './TransactionList';

export function Dashboard() {
  const transactions = useTransactions();
  const hasData = transactions.length > 0;

  // All-time stats
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

  // Month-over-month trend: compare most recent month vs the one before it
  const monthlyData = transactions.reduce((acc, t) => {
    const m = t.date?.substring(0, 7);
    if (!m) return acc;
    if (!acc[m]) acc[m] = { income: 0, spent: 0 };
    if (t.type === 'credit') acc[m].income += t.amount;
    else acc[m].spent += t.amount;
    return acc;
  }, {} as Record<string, { income: number; spent: number }>);

  const months = Object.keys(monthlyData).sort();
  const cur = months[months.length - 1];
  const prev = months[months.length - 2];

  const pctChange = (current: number, previous: number): string => {
    if (!previous || previous === 0) return '—';
    const p = ((current - previous) / previous) * 100;
    return (p >= 0 ? '+' : '') + p.toFixed(0) + '%';
  };

  const curIncome  = cur  ? monthlyData[cur].income  : 0;
  const prevIncome = prev ? monthlyData[prev].income  : 0;
  const curSpent   = cur  ? monthlyData[cur].spent    : 0;
  const prevSpent  = prev ? monthlyData[prev].spent   : 0;
  const curNet     = curIncome  - curSpent;
  const prevNet    = prevIncome - prevSpent;
  const curRate    = curIncome  > 0 ? (curNet  / curIncome)  * 100 : 0;
  const prevRate   = prevIncome > 0 ? (prevNet / prevIncome) * 100 : 0;

  const incomeTrend = hasData && prev ? pctChange(curIncome, prevIncome) : '+12%';
  const spentTrend  = hasData && prev ? pctChange(curSpent,  prevSpent)  : '+8%';
  const netTrend    = hasData && prev ? pctChange(curNet,    prevNet)    : '+45%';
  const rateTrend   = hasData && prev ? pctChange(curRate,   prevRate)   : '+3%';

  // Label: most recent month name
  const monthLabel = cur
    ? new Date(cur + '-02').toLocaleString('default', { month: 'long', year: 'numeric' })
    : 'Sample Data';

  return (
    <div className="size-full overflow-auto">
      <div className="min-h-full p-6">
        {/* Page title */}
        <div className="mb-8">
          <h2 className="text-2xl tracking-tight">Dashboard</h2>
          <p className="text-[#5a5a5a] text-sm mt-1">
            {hasData ? `${monthLabel} · ${transactions.length} transactions` : 'Sample Data'}
          </p>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <StatsCard label="Income"       value={hasData ? fmt(income)          : '$8,450'}  trend={incomeTrend} color="green"  />
          <StatsCard label="Spent"        value={hasData ? fmt(expenses)        : '$6,234'}  trend={spentTrend}  color="red"    />
          <StatsCard label="Net"          value={hasData ? fmt(net)             : '$2,216'}  trend={netTrend}    color="green"  />
          <StatsCard label="Savings Rate" value={hasData ? `${savingsRate}%`    : '26.2%'}   trend={rateTrend}   color="yellow" />
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