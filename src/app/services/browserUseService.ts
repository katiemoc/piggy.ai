// src/services/browserUseService.ts

const BU_API = "https://api.browser-use.com/api/v3";

const API_KEY =
  import.meta.env.VITE_BROWSER_USE_API_KEY ||
  import.meta.env.VITE_BROWSER_USE_KEY;

if (!API_KEY) {
  console.warn("[BrowserUse] Missing Browser Use API key");
}

const headers = {
  "Content-Type": "application/json",
  "X-Browser-Use-API-Key": API_KEY,
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

  const response = await fetch(`${BU_API}/sessions`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      task: instruction.trim(),
    }),
  });

  if (!response.ok) {
    const errBody = await parseErrorResponse(response);
    throw new Error(`Failed to create session (${response.status}): ${errBody}`);
  }

  const data = await response.json();
  const sessionId = data.id ?? data.sessionId;

  if (!sessionId) {
    throw new Error("Browser Use did not return a session ID");
  }

  return sessionId;
}

export async function getTaskStatus(sessionId: string): Promise<SessionStatus> {
  const response = await fetch(`${BU_API}/sessions/${encodeURIComponent(sessionId)}`, {
    method: "GET",
    headers,
  });

  if (!response.ok) {
    const errBody = await parseErrorResponse(response);
    throw new Error(`Failed to get session status (${response.status}): ${errBody}`);
  }

  const data = await response.json();

  return {
    sessionId: data.id ?? data.sessionId ?? sessionId,
    status: data.status,
    liveUrl: data.live_url ?? data.liveUrl,
    output: data.output ?? data.result ?? "",
    error: data.error,
  };
}

export async function stopTask(sessionId: string): Promise<void> {
  try {
    await fetch(`${BU_API}/sessions/${sessionId}`, {
      method: "DELETE",
      headers,
    });
  } catch {
    // best-effort — don't throw if cleanup fails
  }
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
  if (/restaurant|mcdonald|chipotle|doordash|grubhub|coffee|starbucks/.test(d)) return "Food & Dining";
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

// ── Test utilities ────────────────────────────────────────────────────────────

// Validates step 1 (session launch) only — navigates to a harmless public page
export async function createSessionLaunchTest(): Promise<string> {
  const response = await fetch(`${BU_API}/sessions`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      task: `Go to https://example.com and confirm the page title contains "Example Domain". Then stop.`,
    }),
  });
  if (!response.ok) throw new Error(`Session launch failed (${response.status}): ${await response.text()}`);
  const data = await response.json();
  return data.id;
}

// Validates steps 1–4 (launch → login → navigate → download) using a public test site.
// Credentials are public and intentionally shared — no real account involved.
export async function createDemoLoginTask(): Promise<string> {
  const response = await fetch(`${BU_API}/sessions`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      task: `
        Go to https://the-internet.herokuapp.com/login.
        Fill the username field with "tomsmith".
        Fill the password field with "SuperSecretPassword!".
        Click the login button.
        Confirm the page shows "Secure Area" — this validates post-login navigation.
        Then go to https://the-internet.herokuapp.com/download.
        Click on any .csv file to download it.
        Extract the text content of the downloaded file and return it as the output.
      `.trim(),
    }),
  });
  if (!response.ok) throw new Error(`Demo task failed (${response.status}): ${await response.text()}`);
  const data = await response.json();
  return data.id;
}

// Validates step 5 (CSV ingestion) with no BrowserUse needed.
// Pass any CSV string — it goes through the same parse + save pipeline as real data.
export const SAMPLE_CSV = `date,description,amount,type,category,bank
2026-01-03,Paycheck Direct Deposit,4200.00,credit,Income,Test Bank
2026-01-05,Whole Foods Market,89.45,debit,Food & Dining,Test Bank
2026-01-07,Netflix,15.99,debit,Subscriptions,Test Bank
2026-01-09,Shell Gas Station,52.10,debit,Transport,Test Bank
2026-01-11,Amazon Purchase,134.00,debit,Shopping,Test Bank
2026-01-14,Rent Payment,1500.00,debit,Housing,Test Bank
2026-01-28,Freelance Payment,800.00,credit,Income,Test Bank`;

export function ingestCSVString(csv: string, bank = "Test Bank"): Transaction[] {
  const lines = csv.trim().split("\n");
  const headers = lines[0].split(",");
  return lines.slice(1).map((line) => {
    const values = line.split(",");
    const row: Record<string, string> = {};
    headers.forEach((h, i) => { row[h.trim()] = (values[i] ?? "").trim(); });
    return {
      date: row.date || "",
      description: row.description || "",
      amount: Math.abs(parseFloat(row.amount) || 0),
      type: row.type === "credit" ? "credit" : "debit",
      category: row.category || categorize(row.description || ""),
      bank: row.bank || bank,
    };
  });
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