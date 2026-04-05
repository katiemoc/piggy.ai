// src/services/browserUseService.ts

const BU_API = "https://api.browser-use.com/api/v2";

// Guard: surface a clear error if key is missing
const API_KEY = import.meta.env.VITE_BROWSER_USE_API_KEY as string;
if (!API_KEY) console.warn("[BrowserUse] VITE_BROWSER_USE_API_KEY is not set");

const headers = {
  "Authorization": `Bearer ${API_KEY}`,
  "Content-Type": "application/json",
};

const BANK_INSTRUCTIONS: Record<string, string> = {
  citibank: `
    Go to https://online.citibank.com. 
    Wait for the user to log in (pause for human input if needed).
    After login, navigate to the transaction history or statements section.
    Find the last 3 months of transactions.
    Extract all transactions as a list with: date, description, amount, type (debit/credit).
    Return as JSON array: [{date, description, amount, type, category}]
  `,
  chase: `
    Go to https://chase.com and click "Sign In".
    Wait for the user to log in.
    Navigate to "Accounts" → select the main checking/credit account.
    Go to transaction history, set range to last 90 days.
    Extract all transactions: date, description, amount, type.
    Return as JSON array: [{date, description, amount, type, category}]
  `,
  golden1: `
    Go to https://www.golden1.com and click "Online Banking Login".
    Wait for the user to log in.
    Navigate to account activity/transaction history.
    Extract last 90 days of transactions: date, description, amount, type.
    Return as JSON array: [{date, description, amount, type, category}]
  `,
  "bank of america": `
    Go to https://bankofamerica.com and click "Sign In".
    Wait for the user to log in.
    Navigate to the checking or savings account.
    Extract last 90 days of transactions: date, description, amount, type.
    Return as JSON array: [{date, description, amount, type, category}]
  `,
  wells_fargo: `
    Go to https://wellsfargo.com and click "Sign On".
    Wait for the user to log in.
    Navigate to account activity.
    Extract last 90 days of transactions: date, description, amount, type.
    Return as JSON array: [{date, description, amount, type, category}]
  `,
};

export interface Transaction {
  date: string;
  description: string;
  amount: number;
  type: "debit" | "credit";
  category: string;
  bank: string;
}

export interface TaskStatus {
  taskId: string;
  status: "created" | "running" | "paused" | "finished" | "failed" | "stopped";
  liveUrl?: string;
  output?: string;
  error?: string;
}

// ✅ Fixed: only `task` in body — no unsupported fields
export async function createBankTask(bank: string): Promise<string> {
  const instruction = BANK_INSTRUCTIONS[bank.toLowerCase()];
  if (!instruction) throw new Error(`Unsupported bank: ${bank}`);

  const response = await fetch(`${BU_API}/run-task`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      task: instruction.trim(),   // ✅ only valid v2 field
    }),
  });

  if (!response.ok) {
    const errBody = await response.text();
    throw new Error(`Failed to create task (${response.status}): ${errBody}`);
  }

  const data = await response.json();
  return data.id;
}

export async function getTaskStatus(taskId: string): Promise<TaskStatus> {
  const response = await fetch(`${BU_API}/task/${taskId}`, { headers });
  if (!response.ok) throw new Error(`Failed to get task status (${response.status})`);
  const data = await response.json();

  return {
    taskId: data.id,
    status: data.status,
    liveUrl: data.live_url,
    output: data.output,
    error: data.error,
  };
}

// ✅ Fixed: correct v2 stop endpoint is /task/{id}/stop
export async function stopTask(taskId: string): Promise<void> {
  await fetch(`${BU_API}/task/${taskId}/stop`, {
    method: "PUT",
    headers,
  });
}

export async function pollUntilDone(
  taskId: string,
  onUpdate: (status: TaskStatus) => void,
  intervalMs = 3000
): Promise<TaskStatus> {
  return new Promise((resolve, reject) => {
    const interval = setInterval(async () => {
      try {
        const status = await getTaskStatus(taskId);
        onUpdate(status);

        if (["finished", "failed", "stopped"].includes(status.status)) {
          clearInterval(interval);
          if (status.status === "finished") resolve(status);
          else reject(new Error(status.error || `Task ended with status: ${status.status}`));
        }
      } catch (err) {
        clearInterval(interval);
        reject(err);
      }
    }, intervalMs);
  });
}

export function parseTransactions(output: string, bank: string): Transaction[] {
  try {
    const jsonMatch = output.match(/\[[\s\S]*\]/);
    if (!jsonMatch) return [];

    const raw = JSON.parse(jsonMatch[0]);
    return raw.map((t: any) => ({
      date: t.date || "",
      description: t.description || t.merchant || "",
      amount: Math.abs(parseFloat(t.amount) || 0),
      type: t.type === "credit" ? "credit" : "debit",
      category: t.category || categorize(t.description || ""),
      bank,
    }));
  } catch {
    return [];
  }
}

function categorize(description: string): string {
  const d = description.toLowerCase();
  if (/uber|lyft|bart|muni|gas|shell|chevron/.test(d)) return "Transport";
  if (/amazon|walmart|target|costco/.test(d)) return "Shopping";
  if (/restaurant|mcdonald|chipotle|doordash|grubhub|coffee|starbucks/.test(d)) return "Food & Dining";
  if (/netflix|spotify|hulu|apple|disney/.test(d)) return "Subscriptions";
  if (/rent|apartment|landlord/.test(d)) return "Housing";
  if (/venmo|zelle|transfer/.test(d)) return "Transfer";
  if (/paycheck|salary|deposit|income/.test(d)) return "Income";
  return "Other";
}

export function transactionsToCSV(transactions: Transaction[]): string {
  const header = "date,description,amount,type,category,bank";
  const rows = transactions.map(t =>
    `${t.date},"${t.description.replace(/"/g, '""')}",${t.amount},${t.type},${t.category},${t.bank}`
  );
  return [header, ...rows].join("\n");
}

export function saveTransactionsToStorage(transactions: Transaction[]): void {
  const existing: Transaction[] = JSON.parse(
    localStorage.getItem("piggy_transactions") || "[]"
  );
  const merged = [...existing, ...transactions];
  const seen = new Set<string>();
  const deduped = merged.filter(t => {
    const key = `${t.date}-${t.description}-${t.amount}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
  localStorage.setItem("piggy_transactions", JSON.stringify(deduped));
}