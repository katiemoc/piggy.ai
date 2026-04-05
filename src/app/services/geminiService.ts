import type { Transaction } from './browserUseService';
import { normalizeCategory } from './browserUseService';

const API_URL = (import.meta.env.VITE_API_URL ?? '').replace(/\/$/, '');

export const parseBankStatementPDF = async (file: File): Promise<Transaction[]> => {
  const formData = new FormData();
  formData.append('pdf', file);

  const response = await fetch(`${API_URL}/api/chat/parse-statement`, {
    method: 'POST',
    body: formData,
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || 'Failed to parse PDF through backend proxy');
  }

  // Normalize Gemini's raw category strings → canonical 7 categories
  return (data.transactions as Transaction[]).map(t => ({
    ...t,
    category: normalizeCategory(t.category),
  }));
};
