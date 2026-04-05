import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import type { Transaction } from '../services/browserUseService';

const SAMPLE_DATA = [
  { name: 'Housing',       value: 2100, color: '#3d85c8' },
  { name: 'Food',          value: 850,  color: '#e8924a' },
  { name: 'Transport',     value: 650,  color: '#9b6b9b' },
  { name: 'Entertainment', value: 480,  color: '#4db6ac' },
  { name: 'Shopping',      value: 720,  color: '#e8c84a' },
  { name: 'Healthcare',    value: 340,  color: '#e07b7b' },
  { name: 'Other',         value: 1094, color: '#78909c' },
];

const CATEGORY_COLORS: Record<string, string> = {
  Housing:       '#3d85c8',
  Food:          '#e8924a',
  'Food & Dining': '#e8924a',
  Transport:     '#9b6b9b',
  Entertainment: '#4db6ac',
  Shopping:      '#e8c84a',
  Healthcare:    '#e07b7b',
  Subscriptions: '#66bb6a',
  Income:        '#57886c',
  Transfer:      '#aaaaaa',
  Other:         '#78909c',
};

interface Props {
  transactions?: Transaction[];
}

export function SpendingChart({ transactions }: Props) {
  const data = transactions && transactions.length > 0
    ? Object.entries(
        transactions
          .filter(t => t.type === 'debit')
          .reduce((acc, t) => {
            acc[t.category] = (acc[t.category] || 0) + t.amount;
            return acc;
          }, {} as Record<string, number>)
      ).map(([name, value]) => ({
        name,
        value: Math.round(value),
        color: CATEGORY_COLORS[name] || '#78909c',
      }))
    : SAMPLE_DATA;

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
            {data.map((entry, i) => (
              <Cell key={`cell-${i}`} fill={entry.color} />
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