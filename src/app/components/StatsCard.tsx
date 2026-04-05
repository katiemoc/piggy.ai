interface StatsCardProps {
  label: string;
  value: string;
  trend: string;
  color: 'green' | 'red' | 'yellow';
}

export function StatsCard({ label, value, trend, color }: StatsCardProps) {
  const colorClasses = {
    green: 'text-[#57886c]',
    red: 'text-[#c0392b]',
    yellow: 'text-[#fbbf24]',
  };

  const bgClasses = {
    green: 'bg-[#81a684]/20',
    red: 'bg-[#c0392b]/15',
    yellow: 'bg-[#fbbf24]/20',
  };

  return (
    <div className="bg-white border border-[#e0e0e0] rounded-lg p-4">
      <div className="text-[#5a5a5a] text-sm mb-2">{label}</div>
      <div className={`text-2xl ${colorClasses[color]}`}>{value}</div>
    </div>
  );
}