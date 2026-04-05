// src/services/browserUseService.ts

const BACKEND_API =
  (import.meta.env.VITE_API_BASE_URL as string | undefined)?.replace(/\/$/, "") || "";

const headers = {
  "Content-Type": "application/json",
};

const BANK_INSTRUCTIONS: Record<string, string> = {
  citibank: `
    Go to https://online.citibank.com.
    Wait for the user to log in.
    Navigate to statements or transaction history.
    Find the last 3 months of transactions.
    Extract transactions as JSON array:
    [{date, description, amount, type, category}]
  `,
  chase: `
    Go to https://chase.com and click "Sign In".
    Wait for the user to log in.
    Navigate to the main account transaction history.
    Set range to last 90 days.
    Extract transactions as JSON array:
    [{date, description, amount, type, category}]
  `,
  golden1: `
    Go to https://www.golden1.com and click "Online Banking Login".
    Wait for the user to log in.
    Navigate to account activity.
    Extract last 90 days of transactions as JSON array:
    [{date, description, amount, type, category}]
  `,
  "bank of america": `
    Go to https://bankofamerica.com and click "Sign In".
    Wait for the user to log in.
    Navigate to the checking or savings account.
    Extract last 90 days of transactions as JSON array:
    [{date, description, amount, type, category}]
  `,
  wells_fargo: `
    Go to https://wellsfargo.com and click "Sign On".
    Wait for the user to log in.
    Navigate to account activity.
    Extract last 90 days of transactions as JSON array:
    [{date, description, amount, type, category}]
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

export interface SessionStatus {
  sessionId: string;
  status: string;
  liveUrl?: string;
  output?: string;
  error?: string;
}

function getApiUrl(path: string): string {
  return `${BACKEND_API}${path}`;
}

async function parseErrorResponse(response: Response): Promise<string> {
  const text = await response.text();
  try {
    const json = JSON.parse(text);
    return json.error || json.detail || text;
  } catch {
    return text;
  }
}

export async function createBankTask(bank: string): Promise<string> {
  const normalizedBank = bank.toLowerCase();
  const instruction = BANK_INSTRUCTIONS[normalizedBank];

  if (!instruction) {
    throw new Error(`Unsupported bank: ${bank}`);
  }

  const response = await fetch(getApiUrl("/api/browseruse/session"), {
    method: "POST",
    headers,
    body: JSON.stringify({
      bank: normalizedBank,
      task: instruction.trim(),
    }),
  });

  if (!response.ok) {
    const errBody = await parseErrorResponse(response);
    throw new Error(`Failed to create session (${response.status}): ${errBody}`);
  }

  const data = await response.json();

  const sessionId = data.sessionId ?? data.id;
  if (!sessionId) {
    throw new Error("Backend did not return a session ID");
  }

  return sessionId;
}

export async function getTaskStatus(sessionId: string): Promise<SessionStatus> {
  const response = await fetch(
    getApiUrl(`/api/browseruse/session/${encodeURIComponent(sessionId)}`),
    {
      method: "GET",
      headers,
    }
  );

  if (!response.ok) {
    const errBody = await parseErrorResponse(response);
    throw new Error(`Failed to get session status (${response.status}): ${errBody}`);
  }

  const data = await response.json();

  return {
    sessionId: data.sessionId ?? data.id ?? sessionId,
    status: data.status,
    liveUrl: data.liveUrl ?? data.live_url,
    output: data.output ?? data.result ?? "",
    error: data.error,
  };
}

export async function pollUntilDone(
  sessionId: string,
  onUpdate: (status: SessionStatus) => void,
  intervalMs = 3000
): Promise<SessionStatus> {
  return new Promise((resolve, reject) => {
    const interval = setInterval(async () => {
      try {
        const status = await getTaskStatus(sessionId);
        onUpdate(status);

        if (["finished", "completed", "failed", "stopped"].includes(status.status)) {
          clearInterval(interval);

          if (["finished", "completed"].includes(status.status)) {
            resolve(status);
          } else {
            reject(new Error(status.error || `Session ended with status: ${status.status}`));
          }
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
    if (!Array.isArray(raw)) return [];

    return raw.map((t: any) => ({
      date: t.date || "",
      description: t.description || t.merchant || "",
      amount: Math.abs(parseFloat(t.amount) || 0),
      type: t.type === "credit" ? "credit" : "debit",
      category: t.category || categorize(t.description || t.merchant || ""),
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
  if (/restaurant|mcdonald|chipotle|doordash|grubhub|coffee|starbucks/.test(d)) {
    return "Food & Dining";
  }
  if (/netflix|spotify|hulu|apple|disney/.test(d)) return "Subscriptions";
  if (/rent|apartment|landlord/.test(d)) return "Housing";
  if (/venmo|zelle|transfer/.test(d)) return "Transfer";
  if (/paycheck|salary|deposit|income/.test(d)) return "Income";

  return "Other";
}

export function transactionsToCSV(transactions: Transaction[]): string {
  const header = "date,description,amount,type,category,bank";

  const rows = transactions.map((t) => {
    const escapedDescription = (t.description ?? "").replace(/"/g, '""');
    return `${t.date},"${escapedDescription}",${t.amount},${t.type},${t.category},${t.bank}`;
  });

  return [header, ...rows].join("\n");
}

export function saveTransactionsToStorage(transactions: Transaction[]): void {
  const existing: Transaction[] = JSON.parse(
    localStorage.getItem("piggy_transactions") || "[]"
  );

  const merged = [...existing, ...transactions];
  const seen = new Set<string>();

  const deduped = merged.filter((t) => {
    const key = `${t.date}-${t.description}-${t.amount}-${t.bank}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  localStorage.setItem("piggy_transactions", JSON.stringify(deduped));
}