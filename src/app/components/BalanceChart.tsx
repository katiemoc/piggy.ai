import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import type { Transaction } from '../services/browserUseService';

const SAMPLE_DATA = [
  { month: 'Jan', balance: 3200,  projected: null },
  { month: 'Feb', balance: 4100,  projected: null },
  { month: 'Mar', balance: 5450,  projected: null },
  { month: 'Apr', balance: 7666,  projected: null },
  { month: 'May', balance: null,  projected: 9800 },
  { month: 'Jun', balance: null,  projected: 12100 },
  { month: 'Jul', balance: null,  projected: 14300 },
];

const MONTH_LABELS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

interface Props {
  transactions?: Transaction[];
}

export function BalanceChart({ transactions }: Props) {
  let data = SAMPLE_DATA;

  if (transactions && transactions.length > 0) {
    // Group by month, compute running net per month
    const byMonth: Record<string, number> = {};
    transactions.forEach(t => {
      const month = MONTH_LABELS[new Date(t.date).getMonth()];
      if (!month) return;
      byMonth[month] = (byMonth[month] || 0) + (t.type === 'credit' ? t.amount : -t.amount);
    });

    // Build cumulative balance
    const months = Object.keys(byMonth);
    let running = 0;
    const actual = months.map(month => {
      running += byMonth[month];
      return { month, balance: Math.round(running), projected: null };
    });

    // Simple projection: last 3 months avg net
    const recentNets = months.slice(-3).map(m => byMonth[m]);
    const avgNet = recentNets.reduce((a, b) => a + b, 0) / (recentNets.length || 1);
    const lastMonth = MONTH_LABELS.indexOf(months[months.length - 1]);
    const projected = [1, 2, 3].map(i => ({
      month: MONTH_LABELS[(lastMonth + i) % 12],
      balance: null,
      projected: Math.round(running + avgNet * i),
    }));

    data = [...actual, ...projected] as typeof SAMPLE_DATA;
  }

  return (
    <div className="bg-white border border-[#e0e0e0] rounded-lg p-6">
      <h3 className="text-lg mb-4">Balance Over Time</h3>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
          <XAxis dataKey="month" stroke="#5a5a5a" style={{ fontSize: '12px' }} />
          <YAxis
            stroke="#5a5a5a"
            style={{ fontSize: '12px' }}
            tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#ffffff',
              border: '1px solid #e0e0e0',
              borderRadius: '8px',
              color: '#1a1a1a',
            }}
            formatter={(value: number) => `$${value.toLocaleString()}`}
          />
          <Line
            type="monotone"
            dataKey="balance"
            name="Balance"
            stroke="#57886c"
            strokeWidth={2}
            dot={{ fill: '#57886c', r: 4 }}
            connectNulls={false}
            isAnimationActive={false}
          />
          <Line
            type="monotone"
            dataKey="projected"
            name="Projected"
            stroke="#57886c"
            strokeWidth={2}
            strokeDasharray="5 5"
            dot={{ fill: '#57886c', r: 4 }}
            connectNulls={true}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}