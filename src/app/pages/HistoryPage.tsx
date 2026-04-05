import { useMemo, useState } from 'react';
import { FileText, TrendingUp, TrendingDown, Calendar, Upload } from 'lucide-react';
import { useNavigate } from 'react-router';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useTransactions } from '../hooks/useTransactions';
import type { Transaction } from '../services/browserUseService';

const fmt = (n: number) =>
  '$' + n.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 });

function monthLabel(key: string) {
  const [year, month] = key.split('-');
  return new Date(Number(year), Number(month) - 1, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

interface MonthStats {
  key: string;
  label: string;
  income: number;
  expenses: number;
  net: number;
  savingsRate: number;
  transactions: Transaction[];
  chartData: { day: string; balance: number }[];
}

function buildMonthStats(transactions: Transaction[]): MonthStats[] {
  const grouped: Record<string, Transaction[]> = {};
  for (const t of transactions) {
    const key = t.date?.slice(0, 7); // YYYY-MM
    if (!key) continue;
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(t);
  }

  return Object.entries(grouped)
    .sort(([a], [b]) => a.localeCompare(b)) // chronological: oldest first
    .map(([key, txns]) => {
      const income = txns.filter(t => t.type === 'credit').reduce((s, t) => s + t.amount, 0);
      const expenses = txns.filter(t => t.type === 'debit').reduce((s, t) => s + t.amount, 0);
      const net = income - expenses;
      const savingsRate = income > 0 ? (net / income) * 100 : 0;

      // Build cumulative balance chart by day
      const sorted = [...txns].sort((a, b) => a.date.localeCompare(b.date));
      let running = 0;
      const byDay: Record<string, number> = {};
      for (const t of sorted) {
        running += t.type === 'credit' ? t.amount : -t.amount;
        byDay[t.date] = running;
      }
      const chartData = Object.entries(byDay).map(([date, balance]) => ({
        day: date.slice(5), // MM-DD
        balance: Math.round(balance),
      }));

      return { key, label: monthLabel(key), income, expenses, net, savingsRate, transactions: txns, chartData };
    });
}

export function HistoryPage() {
  const transactions = useTransactions();
  const navigate = useNavigate();

  const months = useMemo(() => buildMonthStats(transactions), [transactions]);
  const [selectedKey, setSelectedKey] = useState<string | null>(null);

  const mostRecent = months[months.length - 1];
  const selected = selectedKey
    ? months.find(m => m.key === selectedKey) ?? mostRecent
    : mostRecent;

  if (transactions.length === 0) {
    return (
      <div className="p-6">
        <div className="mb-8">
          <h2 className="text-2xl tracking-tight">History</h2>
          <p className="text-[#5a5a5a] text-sm mt-1">Browse your past uploads and monthly breakdowns</p>
        </div>
        <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
          <div className="text-4xl">📂</div>
          <p className="text-[#1a1a1a]">No transactions yet</p>
          <p className="text-sm text-[#5a5a5a]">Upload a statement or add transactions manually to see your history.</p>
          <button
            onClick={() => navigate('/upload')}
            className="mt-2 flex items-center gap-2 px-5 py-2.5 bg-[#57886c] text-white rounded-lg text-sm hover:bg-[#466060] transition-colors"
          >
            <Upload className="w-4 h-4" />
            Add Transactions
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-8">
        <h2 className="text-2xl tracking-tight">History</h2>
        <p className="text-[#5a5a5a] text-sm mt-1">Browse your monthly breakdowns</p>
      </div>

      {/* Month Selector */}
      <div className="flex gap-2 flex-wrap mb-8">
        {months.map((m) => (
          <button
            key={m.key}
            onClick={() => setSelectedKey(m.key)}
            className={`px-4 py-2 rounded-full text-sm border transition-colors ${selected?.key === m.key
              ? 'bg-[#57886c] text-white border-[#57886c]'
              : 'bg-white border-[#e0e0e0] text-[#5a5a5a] hover:border-[#57886c]'
              }`}
          >
            {m.label}
          </button>
        ))}
      </div>

      {selected && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: stats + chart + transactions */}
          <div className="lg:col-span-2 flex flex-col gap-6">
            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { label: 'Income', value: fmt(selected.income), positive: true },
                { label: 'Spent', value: fmt(selected.expenses), positive: false },
                { label: 'Net', value: fmt(selected.net), positive: selected.net >= 0 },
                { label: 'Savings', value: `${selected.savingsRate.toFixed(1)}%`, positive: selected.savingsRate >= 0 },
              ].map((s) => (
                <div key={s.label} className="bg-white border border-[#e0e0e0] rounded-lg p-4">
                  <div className="text-xs text-[#5a5a5a] mb-1">{s.label}</div>
                  <div className={`text-lg ${s.positive ? 'text-[#57886c]' : 'text-[#c0392b]'}`}>{s.value}</div>
                </div>
              ))}
            </div>

            {/* Balance chart */}
            {selected.chartData.length > 0 && (
              <div className="bg-white border border-[#e0e0e0] rounded-lg p-6">
                <h3 className="text-base mb-4">Running Balance — {selected.label}</h3>
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={selected.chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                    <XAxis dataKey="day" stroke="#5a5a5a" style={{ fontSize: '12px' }} />
                    <YAxis stroke="#5a5a5a" style={{ fontSize: '12px' }} tickFormatter={(v) => `$${(v / 1000).toFixed(1)}k`} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#fff', border: '1px solid #e0e0e0', borderRadius: '8px' }}
                      formatter={(v: number) => `$${v.toLocaleString()}`}
                    />
                    <Line type="monotone" dataKey="balance" stroke="#57886c" strokeWidth={2} dot={{ fill: '#57886c', r: 4 }} isAnimationActive={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Transactions */}
            <div className="bg-white border border-[#e0e0e0] rounded-lg p-6">
              <h3 className="text-base mb-4">
                Transactions
                <span className="text-xs text-[#5a5a5a] ml-2">({selected.transactions.length})</span>
              </h3>
              <div className="flex flex-col gap-0.5">
                {[...selected.transactions]
                  .sort((a, b) => b.date.localeCompare(a.date))
                  .map((t, i) => (
                    <div key={`${t.description}-${t.date}-${i}`} className="flex items-center justify-between py-2.5 border-b border-[#e0e0e0]/50 last:border-0">
                      <div>
                        <div className="text-sm">{t.description}</div>
                        <div className="text-xs text-[#5a5a5a]">{t.category} · {t.date}</div>
                      </div>
                      <div className={`text-sm shrink-0 ml-4 ${t.type === 'credit' ? 'text-[#57886c]' : 'text-[#c0392b]'}`}>
                        {t.type === 'credit' ? '+' : '-'}{fmt(t.amount)}
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </div>

          {/* Right: timeline */}
          <div className="flex flex-col gap-6">
            <div className="bg-white border border-[#e0e0e0] rounded-lg p-6">
              <h3 className="text-base mb-4 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-[#57886c]" />
                Savings Timeline
              </h3>
              <div className="flex flex-col gap-3">
                {months.map((m) => {
                  const isSelected = m.key === selected.key;
                  return (
                    <button
                      key={m.key}
                      onClick={() => setSelectedKey(m.key)}
                      className={`flex items-center gap-3 text-left w-full rounded-lg p-2 transition-colors ${isSelected ? 'bg-[#57886c]/10' : 'hover:bg-[#f5f5f0]'}`}
                    >
                      <div className={`w-2 h-2 rounded-full shrink-0 ${m.savingsRate >= 20 ? 'bg-[#57886c]' : m.savingsRate >= 10 ? 'bg-[#fbbf24]' : 'bg-[#c0392b]'}`} />
                      <div className="flex-1 min-w-0">
                        <div className="text-xs truncate">{m.label}</div>
                        <div className="text-xs text-[#5a5a5a]">{m.savingsRate.toFixed(1)}% saved · {m.transactions.length} txns</div>
                      </div>
                      {m.savingsRate >= 20
                        ? <TrendingUp className="w-3 h-3 text-[#57886c] shrink-0" />
                        : <TrendingDown className="w-3 h-3 text-[#c0392b] shrink-0" />
                      }
                    </button>
                  );
                })}
              </div>

              <button
                onClick={() => navigate('/upload')}
                className="mt-4 w-full flex items-center justify-center gap-2 px-4 py-2 border border-dashed border-[#d0d0d0] rounded-lg text-sm text-[#5a5a5a] hover:border-[#57886c] hover:text-[#57886c] transition-colors"
              >
                <Upload className="w-4 h-4" />
                Add More Transactions
              </button>
            </div>

            {/* Category breakdown */}
            <div className="bg-white border border-[#e0e0e0] rounded-lg p-6">
              <h3 className="text-base mb-4 flex items-center gap-2">
                <FileText className="w-4 h-4 text-[#57886c]" />
                By Category
              </h3>
              <div className="flex flex-col gap-2">
                {Object.entries(
                  selected.transactions
                    .filter(t => t.type === 'debit')
                    .reduce<Record<string, number>>((acc, t) => {
                      acc[t.category] = (acc[t.category] ?? 0) + t.amount;
                      return acc;
                    }, {})
                )
                  .sort(([, a], [, b]) => b - a)
                  .slice(0, 6)
                  .map(([cat, total]) => (
                    <div key={cat} className="flex items-center justify-between text-sm">
                      <span className="text-[#5a5a5a] truncate">{cat}</span>
                      <span className="text-[#c0392b] ml-2 shrink-0">{fmt(total)}</span>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
