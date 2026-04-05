import { useState } from 'react';
import { FileText, TrendingUp, TrendingDown, Calendar, Upload } from 'lucide-react';
import { useNavigate } from 'react-router';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';

const months = ['April 2026', 'March 2026', 'February 2026', 'January 2026', 'December 2025', 'November 2025'];

const monthlyData: Record<string, {
  income: string; spent: string; net: string; savings: string;
  chart: { week: string; balance: number }[];
  uploads: { name: string; date: string; size: string }[];
  transactions: { id: number; desc: string; amount: number; category: string; date: string }[];
}> = {
  'April 2026': {
    income: '$8,450', spent: '$6,234', net: '$2,216', savings: '26.2%',
    chart: [
      { week: 'Wk 1', balance: 5450 }, { week: 'Wk 2', balance: 6100 },
      { week: 'Wk 3', balance: 6800 }, { week: 'Wk 4', balance: 7666 },
    ],
    uploads: [{ name: 'april_statement.csv', date: 'Apr 3, 2026', size: '12 KB' }],
    transactions: [
      { id: 1, desc: 'Salary Deposit', amount: 4225, category: 'Income', date: 'Apr 3' },
      { id: 2, desc: 'Rent Payment', amount: -2100, category: 'Housing', date: 'Apr 3' },
      { id: 3, desc: 'Grocery Store', amount: -156, category: 'Food', date: 'Apr 2' },
    ],
  },
  'March 2026': {
    income: '$7,900', spent: '$6,800', net: '$1,100', savings: '13.9%',
    chart: [
      { week: 'Wk 1', balance: 3800 }, { week: 'Wk 2', balance: 4200 },
      { week: 'Wk 3', balance: 4800 }, { week: 'Wk 4', balance: 5450 },
    ],
    uploads: [
      { name: 'march_statement.csv', date: 'Mar 31, 2026', size: '14 KB' },
      { name: 'march_credit.csv', date: 'Mar 28, 2026', size: '8 KB' },
    ],
    transactions: [
      { id: 1, desc: 'Salary Deposit', amount: 4225, category: 'Income', date: 'Mar 1' },
      { id: 2, desc: 'Rent Payment', amount: -2100, category: 'Housing', date: 'Mar 1' },
      { id: 3, desc: 'Car Insurance', amount: -220, category: 'Transport', date: 'Mar 5' },
    ],
  },
  'February 2026': {
    income: '$7,900', spent: '$5,900', net: '$2,000', savings: '25.3%',
    chart: [
      { week: 'Wk 1', balance: 2100 }, { week: 'Wk 2', balance: 2800 },
      { week: 'Wk 3', balance: 3400 }, { week: 'Wk 4', balance: 3800 },
    ],
    uploads: [{ name: 'feb_statement.csv', date: 'Feb 28, 2026', size: '11 KB' }],
    transactions: [
      { id: 1, desc: 'Salary Deposit', amount: 4225, category: 'Income', date: 'Feb 1' },
      { id: 2, desc: 'Rent Payment', amount: -2100, category: 'Housing', date: 'Feb 1' },
      { id: 3, desc: 'Valentine\'s Dinner', amount: -145, category: 'Food', date: 'Feb 14' },
    ],
  },
  'January 2026': {
    income: '$7,900', spent: '$7,200', net: '$700', savings: '8.9%',
    chart: [
      { week: 'Wk 1', balance: 1800 }, { week: 'Wk 2', balance: 1900 },
      { week: 'Wk 3', balance: 2000 }, { week: 'Wk 4', balance: 2100 },
    ],
    uploads: [{ name: 'january_statement.csv', date: 'Jan 31, 2026', size: '15 KB' }],
    transactions: [
      { id: 1, desc: 'Salary Deposit', amount: 4225, category: 'Income', date: 'Jan 1' },
      { id: 2, desc: 'Rent Payment', amount: -2100, category: 'Housing', date: 'Jan 1' },
      { id: 3, desc: 'New Year\'s Party', amount: -390, category: 'Entertainment', date: 'Jan 1' },
    ],
  },
  'December 2025': {
    income: '$9,200', spent: '$8,900', net: '$300', savings: '3.3%',
    chart: [
      { week: 'Wk 1', balance: 1500 }, { week: 'Wk 2', balance: 1200 },
      { week: 'Wk 3', balance: 1000 }, { week: 'Wk 4', balance: 1800 },
    ],
    uploads: [
      { name: 'dec_checking.csv', date: 'Dec 31, 2025', size: '18 KB' },
      { name: 'dec_savings.csv', date: 'Dec 31, 2025', size: '6 KB' },
    ],
    transactions: [
      { id: 1, desc: 'Salary + Bonus', amount: 6225, category: 'Income', date: 'Dec 15' },
      { id: 2, desc: 'Holiday Gifts', amount: -1240, category: 'Shopping', date: 'Dec 20' },
      { id: 3, desc: 'Flight Home', amount: -480, category: 'Transport', date: 'Dec 22' },
    ],
  },
  'November 2025': {
    income: '$7,900', spent: '$5,600', net: '$2,300', savings: '29.1%',
    chart: [
      { week: 'Wk 1', balance: 800 }, { week: 'Wk 2', balance: 1100 },
      { week: 'Wk 3', balance: 1400 }, { week: 'Wk 4', balance: 1500 },
    ],
    uploads: [{ name: 'november_statement.csv', date: 'Nov 30, 2025', size: '10 KB' }],
    transactions: [
      { id: 1, desc: 'Salary Deposit', amount: 4225, category: 'Income', date: 'Nov 1' },
      { id: 2, desc: 'Rent Payment', amount: -2100, category: 'Housing', date: 'Nov 1' },
      { id: 3, desc: 'Black Friday Haul', amount: -620, category: 'Shopping', date: 'Nov 29' },
    ],
  },
};

export function HistoryPage() {
  const [selectedMonth, setSelectedMonth] = useState('April 2026');
  const navigate = useNavigate();
  const data = monthlyData[selectedMonth];

  const isPositive = (v: string) => !v.startsWith('-') && v !== '$0';

  return (
    <div className="p-6">
      <div className="mb-8">
        <h2 className="text-2xl tracking-tight">History</h2>
        <p className="text-[#5a5a5a] text-sm mt-1">Browse your past uploads and monthly breakdowns</p>
      </div>

      {/* Month Selector */}
      <div className="flex gap-2 flex-wrap mb-8">
        {months.map((m) => (
          <button
            key={m}
            onClick={() => setSelectedMonth(m)}
            className={`px-4 py-2 rounded-full text-sm border transition-colors ${selectedMonth === m
              ? 'bg-[#57886c] text-white border-[#57886c]'
              : 'bg-white border-[#e0e0e0] text-[#5a5a5a] hover:border-[#57886c]'
              }`}
          >
            {m}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: stats + chart */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          {/* Mini stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { label: 'Income', value: data.income, positive: true },
              { label: 'Spent', value: data.spent, positive: false },
              { label: 'Net', value: data.net, positive: true },
              { label: 'Savings', value: data.savings, positive: true },
            ].map((s) => (
              <div key={s.label} className="bg-white border border-[#e0e0e0] rounded-lg p-4">
                <div className="text-xs text-[#5a5a5a] mb-1">{s.label}</div>
                <div className={`text-lg ${s.positive ? 'text-[#57886c]' : 'text-[#c0392b]'}`}>
                  {s.value}
                </div>
              </div>
            ))}
          </div>

          {/* Balance chart */}
          <div className="bg-white border border-[#e0e0e0] rounded-lg p-6">
            <h3 className="text-base mb-4">Balance — {selectedMonth}</h3>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={data.chart}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                <XAxis dataKey="week" stroke="#5a5a5a" style={{ fontSize: '12px' }} />
                <YAxis stroke="#5a5a5a" style={{ fontSize: '12px' }} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#fff', border: '1px solid #e0e0e0', borderRadius: '8px' }}
                  formatter={(v: number) => `$${v.toLocaleString()}`}
                />
                <Line type="monotone" dataKey="balance" stroke="#57886c" strokeWidth={2} dot={{ fill: '#57886c', r: 4 }} isAnimationActive={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Transactions preview */}
          <div className="bg-white border border-[#e0e0e0] rounded-lg p-6">
            <h3 className="text-base mb-4">Top Transactions</h3>
            <div className="flex flex-col gap-2">
              {data.transactions.map((t) => (
                <div key={t.id} className="flex items-center justify-between py-2 border-b border-[#e0e0e0]/50 last:border-0">
                  <div>
                    <div className="text-sm">{t.desc}</div>
                    <div className="text-xs text-[#5a5a5a]">{t.category} · {t.date}</div>
                  </div>
                  <div className={`text-sm ${t.amount > 0 ? 'text-[#57886c]' : 'text-[#c0392b]'}`}>
                    {t.amount > 0 ? '+' : ''}${Math.abs(t.amount).toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right: uploads */}
        <div className="flex flex-col gap-6">
          <div className="bg-white border border-[#e0e0e0] rounded-lg p-6">
            <h3 className="text-base mb-4 flex items-center gap-2">
              <FileText className="w-4 h-4 text-[#57886c]" />
              Past Uploads
            </h3>
            {data.uploads.length > 0 ? (
              <div className="flex flex-col gap-3">
                {data.uploads.map((u, i) => (
                  <div key={i} className="flex items-start gap-3 p-3 bg-[#f5f5f0] rounded-lg">
                    <FileText className="w-4 h-4 text-[#5a5a5a] mt-0.5 shrink-0" />
                    <div className="min-w-0">
                      <div className="text-sm truncate">{u.name}</div>
                      <div className="text-xs text-[#5a5a5a]">{u.date} · {u.size}</div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-[#5a5a5a]">No uploads for this month.</p>
            )}

            <button
              onClick={() => navigate('/')}
              className="mt-4 w-full flex items-center justify-center gap-2 px-4 py-2 border border-dashed border-[#d0d0d0] rounded-lg text-sm text-[#5a5a5a] hover:border-[#57886c] hover:text-[#57886c] transition-colors"
            >
              <Upload className="w-4 h-4" />
              Upload for {selectedMonth}
            </button>
          </div>

          {/* Timeline */}
          <div className="bg-white border border-[#e0e0e0] rounded-lg p-6">
            <h3 className="text-base mb-4 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-[#57886c]" />
              Savings Timeline
            </h3>
            <div className="flex flex-col gap-3">
              {months.map((m, i) => {
                const d = monthlyData[m];
                const pct = parseFloat(d.savings);
                const isSelected = m === selectedMonth;
                return (
                  <button
                    key={m}
                    onClick={() => setSelectedMonth(m)}
                    className={`flex items-center gap-3 text-left w-full rounded-lg p-2 transition-colors ${isSelected ? 'bg-[#57886c]/10' : 'hover:bg-[#f5f5f0]'}`}
                  >
                    <div className={`w-2 h-2 rounded-full shrink-0 ${pct >= 20 ? 'bg-[#57886c]' : pct >= 10 ? 'bg-[#fbbf24]' : 'bg-[#c0392b]'}`} />
                    <div className="flex-1 min-w-0">
                      <div className="text-xs truncate">{m}</div>
                      <div className="text-xs text-[#5a5a5a]">{d.savings} saved</div>
                    </div>
                    {pct >= 20
                      ? <TrendingUp className="w-3 h-3 text-[#57886c] shrink-0" />
                      : <TrendingDown className="w-3 h-3 text-[#c0392b] shrink-0" />
                    }
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
