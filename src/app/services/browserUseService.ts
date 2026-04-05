// services/browserUseService.ts
export interface Transaction {
  date: string;        // YYYY-MM-DD
  description: string;
  amount: number;      // negative = expense, positive = income
  category: string;
  bank: string;
}

export interface BankTask {
  bankId: string;
  bankName: string;
  taskId: string | null;
  status: TaskStatus;
  transactions: Transaction[];
  liveUrl?: string;
  error?: string;
}

export type TaskStatus =
  | 'idle'
  | 'starting'
  | 'waiting_login'
  | 'navigating'
  | 'extracting'
  | 'done'
  | 'error';

export const SUPPORTED_BANKS = [
  { id: 'citibank',   name: 'Citibank',         url: 'https://www.citi.com' },
  { id: 'golden1',   name: 'Golden1 CU',        url: 'https://www.golden1.com' },
  { id: 'chase',     name: 'Chase',             url: 'https://www.chase.com' },
  { id: 'bofa',      name: 'Bank of America',   url: 'https://www.bankofamerica.com' },
  { id: 'wellsfargo',name: 'Wells Fargo',        url: 'https://www.wellsfargo.com' },
  { id: 'usbank',    name: 'US Bank',            url: 'https://www.usbank.com' },
  { id: 'schwab',    name: 'Charles Schwab',     url: 'https://www.schwab.com' },
  { id: 'venmo',     name: 'Venmo',              url: 'https://venmo.com' },
] as const;

export type BankId = typeof SUPPORTED_BANKS[number]['id'];

const BACKEND_API_BASE = import.meta.env.VITE_API_URL ?? '';
const API_BASE = `${BACKEND_API_BASE}/api/browseruse`;

export interface StartTaskResult {
  taskId: string;
  liveUrl?: string;
}

export async function startBankTask(bankId: string): Promise<StartTaskResult> {
  const bank = SUPPORTED_BANKS.find((b) => b.id === bankId);
  if (!bank) throw new Error(`Unknown bank: ${bankId}`);

  const response = await fetch(`${API_BASE}/start`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ bankId: bank.id, bankName: bank.name, bankUrl: bank.url }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Browser Use backend error (${response.status}): ${body}`);
  }

  const text = await response.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch (e) {
    throw new Error(`Invalid JSON response from backend: ${text}`);
  }
  return { taskId: data.sessionId, liveUrl: data.liveUrl };
}

export type BrowserUseStatus = 'created' | 'running' | 'paused' | 'finished' | 'stopped' | 'timed_out' | 'error';

export interface TaskPollResult {
  status: BrowserUseStatus;
  transactions: Transaction[];
  rawOutput?: unknown;
  liveUrl?: string;
}

function parseTransactions(output: unknown): Transaction[] {
  if (!output) return [];
  if (Array.isArray(output)) return output as Transaction[];
  if (typeof output === 'string') {
    const cleaned = output
      .replace(/```json\s*/gi, '')
      .replace(/```\s*/g, '')
      .trim();
    try {
      const parsed = JSON.parse(cleaned);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  if (typeof output === 'object' && output !== null) {
    return [output as Transaction];
  }
  return [];
}

export async function pollBankTask(taskId: string): Promise<TaskPollResult> {
  const response = await fetch(`${API_BASE}/status/${taskId}`);
  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Browser Use backend error (${response.status}): ${body}`);
  }

  const text = await response.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch (e) {
    throw new Error(`Invalid JSON response from backend: ${text}`);
  }
  const transactions = parseTransactions(data.output);
  return {
    status: data.status as BrowserUseStatus,
    transactions,
    rawOutput: data.output,
    liveUrl: data.liveUrl,
  };
}

export function transactionsToCSV(transactions: Transaction[]): string {
  const headers = 'date,bank,description,amount,category';
  const rows = transactions.map((t) => {
    const desc = `"${t.description.replace(/"/g, '""')}"`;
    return `${t.date},${t.bank},${desc},${t.amount},${t.category}`;
  });
  return [headers, ...rows].join('\n');
}

export function downloadCSV(transactions: Transaction[], filename = 'piggyai_statements.csv'): void {
  const csv = transactionsToCSV(transactions);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function saveTransactionsToStorage(transactions: Transaction[]): void {
  try {
    const existing: Transaction[] = JSON.parse(localStorage.getItem('piggyai_transactions') || '[]');
    const key = (t: Transaction) => `${t.date}|${t.description}|${t.amount}`;
    const existingKeys = new Set(existing.map(key));
    const newOnes = transactions.filter((t) => !existingKeys.has(key(t)));
    const merged = [...existing, ...newOnes].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    localStorage.setItem('piggyai_transactions', JSON.stringify(merged));
  } catch (err) {
    console.error('Failed to save transactions:', err);
  }
}

export function mapApiStatus(apiStatus: BrowserUseStatus): TaskStatus {
  switch (apiStatus) {
    case 'created':
      return 'starting';
    case 'running':
      return 'extracting';
    case 'paused':
      return 'waiting_login';
    case 'finished':
    case 'stopped':
      return 'done';
    case 'timed_out':
    case 'error':
      return 'error';
    default:
      return 'navigating';
  }
}