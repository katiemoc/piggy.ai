import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const data = [
  { month: 'Jan', balance: 3200, projected: null },
  { month: 'Feb', balance: 4100, projected: null },
  { month: 'Mar', balance: 5450, projected: null },
  { month: 'Apr', balance: 7666, projected: null },
  { month: 'May', balance: null, projected: 9800 },
  { month: 'Jun', balance: null, projected: 12100 },
  { month: 'Jul', balance: null, projected: 14300 },
];

export function BalanceChart() {
  return (
    <div className="bg-white border border-[#e0e0e0] rounded-lg p-6">
      <h3 className="text-lg mb-4">Balance Over Time</h3>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
          <XAxis
            dataKey="month"
            stroke="#5a5a5a"
            style={{ fontSize: '12px' }}
          />
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