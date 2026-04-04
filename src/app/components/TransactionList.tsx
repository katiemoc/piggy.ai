const transactions = [
  { id: 1, date: '2026-04-03', description: 'Salary Deposit', category: 'Income', amount: 4225, type: 'income' },
  { id: 2, date: '2026-04-03', description: 'Rent Payment', category: 'Housing', amount: -2100, type: 'expense' },
  { id: 3, date: '2026-04-02', description: 'Grocery Store', category: 'Food', amount: -156.43, type: 'expense' },
  { id: 4, date: '2026-04-02', description: 'Gas Station', category: 'Transport', amount: -65.20, type: 'expense' },
  { id: 5, date: '2026-04-01', description: 'Netflix Subscription', category: 'Entertainment', amount: -15.99, type: 'expense' },
  { id: 6, date: '2026-04-01', description: 'Amazon Order', category: 'Shopping', amount: -89.47, type: 'expense' },
  { id: 7, date: '2026-03-31', description: 'Restaurant', category: 'Food', amount: -78.50, type: 'expense' },
  { id: 8, date: '2026-03-31', description: 'Uber Ride', category: 'Transport', amount: -24.30, type: 'expense' },
  { id: 9, date: '2026-03-30', description: 'Pharmacy', category: 'Healthcare', amount: -45.67, type: 'expense' },
  { id: 10, date: '2026-03-30', description: 'Coffee Shop', category: 'Food', amount: -12.50, type: 'expense' },
  { id: 11, date: '2026-03-29', description: 'Freelance Payment', category: 'Income', amount: 850, type: 'income' },
  { id: 12, date: '2026-03-29', description: 'Electric Bill', category: 'Housing', amount: -142.30, type: 'expense' },
];

export function TransactionList() {
  return (
    <div className="bg-white border border-[#e0e0e0] rounded-lg p-6">
      <h3 className="text-lg mb-4">Recent Transactions</h3>
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
            {transactions.map((transaction) => (
              <tr key={transaction.id} className="border-b border-[#e0e0e0]/50 hover:bg-[#f5f5f0] transition-colors">
                <td className="py-3 pr-4 text-sm text-[#5a5a5a]">{transaction.date}</td>
                <td className="py-3 pr-4">{transaction.description}</td>
                <td className="py-3 pr-4 text-sm text-[#5a5a5a]">{transaction.category}</td>
                <td className={`py-3 text-right ${
                  transaction.type === 'income' ? 'text-[#57886c]' : 'text-[#c0392b]'
                }`}>
                  {transaction.type === 'income' ? '+' : ''}${Math.abs(transaction.amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
