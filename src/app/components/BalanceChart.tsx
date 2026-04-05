import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import type { Transaction } from '../services/browserUseService';


interface Props {
  transactions?: Transaction[];
}

export function BalanceChart({ transactions }: Props) {
  let data: { month: string; balance: number | null; projected: number | null }[] = [];

  if (transactions && transactions.length > 0) {
    // Group by YYYY-MM key so we can sort chronologically
    const byMonthKey: Record<string, number> = {};
    transactions.forEach(t => {
      const key = t.date?.slice(0, 7);
      if (!key) return;
      byMonthKey[key] = (byMonthKey[key] || 0) + (t.type === 'credit' ? t.amount : -t.amount);
    });

    const sortedKeys = Object.keys(byMonthKey).sort();
    let running = 0;
    const actual = sortedKeys.map(key => {
      running += byMonthKey[key];
      const [year, month] = key.split('-');
      const label = new Date(Number(year), Number(month) - 1, 1)
        .toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
      return { month: label, balance: Math.round(running), projected: null };
    });

    // Simple projection: last 3 months avg net
    const recentNets = sortedKeys.slice(-3).map(k => byMonthKey[k]);
    const avgNet = recentNets.reduce((a, b) => a + b, 0) / (recentNets.length || 1);
    const lastKey = sortedKeys[sortedKeys.length - 1];
    const [lastYear, lastMonth] = lastKey.split('-').map(Number);
    const projected = [1, 2, 3].map(i => {
      const d = new Date(lastYear, lastMonth - 1 + i, 1);
      const label = d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
      return { month: label, balance: null, projected: Math.round(running + avgNet * i) };
    });

    data = [...actual, ...projected];
  }

  return (
    <div className="bg-white border border-[#e0e0e0] rounded-lg p-6">
      <h3 className="text-lg mb-4">Balance Over Time</h3>
      {data.length === 0 ? (
        <p className="text-sm text-[#5a5a5a] py-6 text-center">No balance data yet.</p>
      ) : (
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
      )}
    </div>
  );
}