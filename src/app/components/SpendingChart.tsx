import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

const data = [
  { name: 'Housing', value: 2100, color: '#3d85c8', id: 'housing' },
  { name: 'Food', value: 850, color: '#e8924a', id: 'food' },
  { name: 'Transport', value: 650, color: '#9b6b9b', id: 'transport' },
  { name: 'Entertainment', value: 480, color: '#4db6ac', id: 'entertainment' },
  { name: 'Shopping', value: 720, color: '#e8c84a', id: 'shopping' },
  { name: 'Healthcare', value: 340, color: '#e07b7b', id: 'healthcare' },
  { name: 'Other', value: 1094, color: '#78909c', id: 'other' },
];

export function SpendingChart() {
  return (
    <div className="bg-white border border-[#e0e0e0] rounded-lg p-6">
      <h3 className="text-lg mb-4">Spending by Category</h3>
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={100}
            paddingAngle={2}
            dataKey="value"
            nameKey="name"
          >
            {data.map((entry) => (
              <Cell key={`cell-${entry.id}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              backgroundColor: '#ffffff',
              border: '1px solid #e0e0e0',
              borderRadius: '8px',
              color: '#1a1a1a',
            }}
            formatter={(value: number) => `$${value.toLocaleString()}`}
          />
          <Legend
            verticalAlign="bottom"
            height={36}
            iconType="circle"
            formatter={(value) => <span style={{ color: '#1a1a1a' }}>{value}</span>}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}