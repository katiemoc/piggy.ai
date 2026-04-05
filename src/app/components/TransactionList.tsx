import type { Transaction } from '../services/browserUseService';

interface Props {
  transactions?: Transaction[];
}

export function TransactionList({ transactions }: Props) {
  const data = transactions && transactions.length > 0
    ? [...transactions].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    : [];

  return (
    <div className="bg-white border border-[#e0e0e0] rounded-lg p-6">
      <h3 className="text-lg mb-4">Recent Transactions</h3>
      {data.length === 0 ? (
        <p className="text-sm text-[#5a5a5a] py-6 text-center">No transactions yet.</p>
      ) : (
        <div className="overflow-auto max-h-[400px]">
          <table className="w-full">
            <thead className="sticky top-0 bg-white border-b border-[#e0e0e0]">
              <tr className="text-left text-[#5a5a5a] text-sm">
                <th className="pb-3 pr-4">Date</th>
                <th className="pb-3 pr-4">Description</th>
                <th className="pb-3 pr-4">Category</th>
                <th className="pb-3 text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              {data.map((t, i) => (
                <tr key={i} className="border-b border-[#e0e0e0]/50 hover:bg-[#f5f5f0] transition-colors">
                  <td className="py-3 pr-4 text-sm text-[#5a5a5a]">{t.date}</td>
                  <td className="py-3 pr-4">{t.description}</td>
                  <td className="py-3 pr-4 text-sm text-[#5a5a5a]">{t.category}</td>
                  <td className={`py-3 text-right ${t.type === 'credit' ? 'text-[#57886c]' : 'text-[#c0392b]'}`}>
                    {t.type === 'credit' ? '+' : '-'}${t.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}