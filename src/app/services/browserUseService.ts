// src/services/browserUseService.ts

const BU_API = "https://api.browser-use.com/api/v2";
const API_KEY = import.meta.env.VITE_BROWSER_USE_API_KEY;

const headers = {
  "Authorization": `Bearer ${API_KEY}`,
  "Content-Type": "application/json",
};

// Bank-specific instructions for the agent
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
  liveUrl?: string;     // URL for user to watch/interact with the browser
  output?: string;      // Final result from agent
  error?: string;
}

// Create a Browser Use task for a single bank
export async function createBankTask(bank: string): Promise<string> {
  const instruction = BANK_INSTRUCTIONS[bank.toLowerCase()];
  if (!instruction) throw new Error(`Unsupported bank: ${bank}`);

  const response = await fetch(`${BU_API}/run-task`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      task: instruction,
      // Allow user to take control for login
      allowed_domains: ["*"],
      save_browser_data: false, // privacy-conscious
    }),
  });

  if (!response.ok) throw new Error(`Failed to create task: ${response.statusText}`);
  const data = await response.json();
  return data.id; // task ID
}

// Poll task status
export async function getTaskStatus(taskId: string): Promise<TaskStatus> {
  const response = await fetch(`${BU_API}/task/${taskId}`, { headers });
  if (!response.ok) throw new Error(`Failed to get task status`);
  const data = await response.json();

  return {
    taskId: data.id,
    status: data.status,
    liveUrl: data.live_url,     // iframe or link for user to log in
    output: data.output,
    error: data.error,
  };
}

// Stop a task
export async function stopTask(taskId: string): Promise<void> {
  await fetch(`${BU_API}/stop-task/${taskId}`, { method: "PUT", headers });
}

// Poll until done (with callback for status updates)
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
          else reject(new Error(status.error || "Task failed"));
        }
      } catch (err) {
        clearInterval(interval);
        reject(err);
      }
    }, intervalMs);
  });
}

// Parse agent output JSON → Transaction[]
export function parseTransactions(output: string, bank: string): Transaction[] {
  try {
    // Agent returns JSON somewhere in its output
    const jsonMatch = output.match(/\[[\s\S]*\]/);
    if (!jsonMatch) return [];

    const raw = JSON.parse(jsonMatch[0]);
    return raw.map((t: any) => ({
      date: t.date || "",
      description: t.description || t.merchant || "",
      amount: Math.abs(parseFloat(t.amount) || 0),
      type: t.type === "credit" ? "credit" : "debit",
      category: t.category || categorize(t.description),
      bank,
    }));
  } catch {
    return [];
  }
}

// Simple rule-based categorizer fallback
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

// Convert transactions to CSV string
export function transactionsToCSV(transactions: Transaction[]): string {
  const header = "date,description,amount,type,category,bank";
  const rows = transactions.map(t =>
    `${t.date},"${t.description.replace(/"/g, '""')}",${t.amount},${t.type},${t.category},${t.bank}`
  );
  return [header, ...rows].join("\n");
}

// Save to localStorage
export function saveTransactionsToStorage(transactions: Transaction[]): void {
  const existing = JSON.parse(localStorage.getItem("piggy_transactions") || "[]");
  const merged = [...existing, ...transactions];
  // Deduplicate by date+description+amount
  const seen = new Set();
  const deduped = merged.filter(t => {
    const key = `${t.date}-${t.description}-${t.amount}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
  localStorage.setItem("piggy_transactions", JSON.stringify(deduped));
}