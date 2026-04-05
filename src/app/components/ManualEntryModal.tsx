import { useState } from 'react';
import { X, Plus, Trash2, Check } from 'lucide-react';
import { type Transaction, saveTransactionsToStorage } from '../services/browserUseService';

const CATEGORIES = [
  'Food & Dining',
  'Shopping',
  'Transportation',
  'Housing & Rent',
  'Utilities',
  'Entertainment',
  'Health & Medical',
  'Travel',
  'Education',
  'Personal Care',
  'Subscriptions',
  'Income',
  'Transfer',
  'Other',
];

interface FormState {
  date: string;
  description: string;
  amount: string;
  type: 'debit' | 'credit';
  category: string;
  bank: string;
}

const EMPTY_FORM: FormState = {
  date: new Date().toISOString().split('T')[0],
  description: '',
  amount: '',
  type: 'debit',
  category: 'Food & Dining',
  bank: 'Manual Entry',
};

interface Props {
  onClose: () => void;
  onSave: () => void;
}

export function ManualEntryModal({ onClose, onSave }: Props) {
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [error, setError] = useState('');

  const set = (key: keyof FormState, val: string) =>
    setForm((f) => ({ ...f, [key]: val }));

  const addTransaction = () => {
    if (!form.description.trim()) { setError('Enter a description.'); return; }
    const amount = parseFloat(form.amount);
    if (!form.amount || isNaN(amount) || amount <= 0) { setError('Enter a valid amount.'); return; }
    if (!form.date) { setError('Enter a date.'); return; }
    setError('');

    const txn: Transaction = {
      date: form.date,
      description: form.description.trim(),
      amount,
      type: form.type,
      category: form.category,
      bank: form.bank.trim() || 'Manual Entry',
    };
    setTransactions((prev) => [txn, ...prev]);
    setForm((f) => ({ ...EMPTY_FORM, date: f.date, bank: f.bank }));
  };

  const remove = (i: number) => setTransactions((prev) => prev.filter((_, idx) => idx !== i));

  const handleSave = () => {
    if (transactions.length === 0) { setError('Add at least one transaction.'); return; }
    saveTransactionsToStorage(transactions);
    onSave();
  };

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') { e.preventDefault(); addTransaction(); }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/30 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl border border-[#e0e0e0] shadow-lg w-full max-w-lg flex flex-col max-h-[90vh]">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#e0e0e0] shrink-0">
          <div>
            <h2 className="text-base text-[#1a1a1a]">Add Transactions Manually</h2>
            <p className="text-xs text-[#5a5a5a] mt-0.5">{transactions.length} transaction{transactions.length !== 1 ? 's' : ''} added</p>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-[#5a5a5a] hover:text-[#1a1a1a] hover:bg-[#f5f5f0] transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <div className="px-5 py-4 border-b border-[#e0e0e0] shrink-0">
          {error && (
            <div className="text-xs text-[#c0392b] bg-[#c0392b]/8 border border-[#c0392b]/20 rounded-lg px-3 py-2 mb-3">
              {error}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3 mb-3">
            <div>
              <label className="text-xs text-[#5a5a5a] block mb-1">Date</label>
              <input
                type="date"
                value={form.date}
                onChange={(e) => set('date', e.target.value)}
                className="w-full border border-[#e0e0e0] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#57886c]"
              />
            </div>
            <div>
              <label className="text-xs text-[#5a5a5a] block mb-1">Bank / Source</label>
              <input
                value={form.bank}
                onChange={(e) => set('bank', e.target.value)}
                placeholder="e.g. Chase"
                className="w-full border border-[#e0e0e0] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#57886c]"
              />
            </div>
          </div>

          <div className="mb-3">
            <label className="text-xs text-[#5a5a5a] block mb-1">Description</label>
            <input
              value={form.description}
              onChange={(e) => set('description', e.target.value)}
              onKeyDown={handleKey}
              placeholder="e.g. Trader Joe's, Netflix, Paycheck..."
              className="w-full border border-[#e0e0e0] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#57886c]"
            />
          </div>

          <div className="grid grid-cols-3 gap-3 mb-3">
            <div>
              <label className="text-xs text-[#5a5a5a] block mb-1">Amount ($)</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={form.amount}
                onChange={(e) => set('amount', e.target.value)}
                onKeyDown={handleKey}
                placeholder="0.00"
                className="w-full border border-[#e0e0e0] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#57886c]"
              />
            </div>
            <div>
              <label className="text-xs text-[#5a5a5a] block mb-1">Type</label>
              <select
                value={form.type}
                onChange={(e) => set('type', e.target.value as 'debit' | 'credit')}
                className="w-full border border-[#e0e0e0] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#57886c] bg-white"
              >
                <option value="debit">Expense</option>
                <option value="credit">Income</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-[#5a5a5a] block mb-1">Category</label>
              <select
                value={form.category}
                onChange={(e) => set('category', e.target.value)}
                className="w-full border border-[#e0e0e0] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#57886c] bg-white"
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>

          <button
            onClick={addTransaction}
            className="w-full flex items-center justify-center gap-2 py-2 bg-[#57886c] text-white rounded-lg text-sm hover:bg-[#466060] transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Transaction
          </button>
        </div>

        {/* Transaction list */}
        <div className="flex-1 overflow-y-auto px-5 py-3">
          {transactions.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full py-8 gap-2 text-center">
              <div className="text-2xl">📋</div>
              <p className="text-sm text-[#5a5a5a]">No transactions yet.</p>
              <p className="text-xs text-[#b0b0b0]">Fill in the form above and click Add.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {transactions.map((t, i) => (
                <div key={i} className="flex items-center justify-between p-3 bg-[#f5f5f0] rounded-lg">
                  <div className="flex-1 min-w-0 mr-3">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-[#1a1a1a] truncate">{t.description}</span>
                      <span className={`text-xs px-1.5 py-0.5 rounded shrink-0 ${t.type === 'credit' ? 'bg-[#57886c]/15 text-[#57886c]' : 'bg-[#c0392b]/10 text-[#c0392b]'}`}>
                        {t.type === 'credit' ? 'Income' : 'Expense'}
                      </span>
                    </div>
                    <div className="text-xs text-[#5a5a5a] mt-0.5">{t.date} · {t.category} · {t.bank}</div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className={`text-sm ${t.type === 'credit' ? 'text-[#57886c]' : 'text-[#1a1a1a]'}`}>
                      {t.type === 'credit' ? '+' : '-'}${t.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </span>
                    <button onClick={() => remove(i)} className="p-1 rounded text-[#5a5a5a] hover:text-[#c0392b] hover:bg-white transition-colors">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-[#e0e0e0] shrink-0 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 border border-[#e0e0e0] rounded-lg text-sm text-[#5a5a5a] hover:bg-[#f5f5f0] transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={transactions.length === 0}
            className="flex-1 px-4 py-2.5 bg-[#57886c] text-white rounded-lg text-sm hover:bg-[#466060] transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <Check className="w-4 h-4" />
            Save & View Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}
