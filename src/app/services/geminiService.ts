import type { Transaction } from './browserUseService';

const API_URL = (import.meta.env.VITE_API_URL ?? '').replace(/\/$/, '');

export const parseBankStatementPDF = async (base64Pdf: string): Promise<Transaction[]> => {
  const response = await fetch(`${API_URL}/api/chat/parse-statement`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ base64Pdf }),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || 'Failed to parse PDF through backend proxy');
  }

  return data.transactions;
};
