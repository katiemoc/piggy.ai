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

// Output format used by all bank prompts — must match Transaction interface
const OUTPUT_FORMAT = `
Return ONLY a raw JSON array (no markdown, no explanation) in this exact shape:
[
  {
    "date": "YYYY-MM-DD",
    "description": "merchant or payee name",
    "amount": 0.00,
    "type": "debit" or "credit",
    "category": "one of: Food & Dining, Shopping, Transport, Housing, Subscriptions, Income, Transfer, Other"
  }
]
Include ALL transactions found. Positive amounts only — use "type" to distinguish debits vs credits.
If there are multiple pages of results, paginate through ALL of them before returning.
`.trim();

// Shared login-wait block injected into every bank prompt.
// Uses explicit DOM/URL polling instead of a passive "wait" instruction
// so BrowserUse has an observable condition to act on rather than timing out.
const LOGIN_WAIT_BLOCK = `
STEP 2 — Wait for the user to log in (DO NOT SKIP THIS STEP):
Do NOT attempt to fill in any credentials or click any login buttons yourself.
Instead, enter a polling loop:
  - Every 5 seconds, check the current page URL and visible DOM text.
  - Only exit this loop and proceed to STEP 3 when AT LEAST ONE of these is true:
      a) The URL contains any of: "dashboard", "accounts", "accountSummary", "home", "overview", "portal"
      b) A visible DOM element contains text matching: "Account Balance", "Available Balance", "Total Balance", "Welcome back", "My Accounts"
  - If neither condition is met, wait 5 more seconds and check again.
  - Continue this loop indefinitely — do NOT time out, do NOT proceed early.
You may only move to STEP 3 after confirming one of the above conditions is true.
`.trim();

const BANK_INSTRUCTIONS: Record<string, string> = {
  citibank: `
You are helping a user export their Citi bank transactions into piggy.ai, a personal finance app.

STEP 1 — Navigate to login:
Go to https://online.citibank.com/US/JPS/portal/Index.do
Click "Sign On" in the top right corner.

${LOGIN_WAIT_BLOCK}

STEP 3 — Find the right account:
On the dashboard, locate the primary checking or savings account.
Click on that account to open the transaction list.

STEP 4 — Set the date range:
Look for a "Date Range", "Search Transactions", or filter option.
Set the start date to exactly 90 days ago from today and the end date to today.
Apply the filter.

STEP 5 — Extract all transactions:
Scroll through all results. If there is a "Show More", "Next Page", or pagination control,
click through every page until all 90 days of transactions are loaded.
Extract every transaction row: date, description/merchant, amount, and whether it is a debit
(money out) or credit (money in).

STEP 6 — Return output:
${OUTPUT_FORMAT}
  `.trim(),

  chase: `
You are helping a user export their Chase bank transactions into piggy.ai, a personal finance app.

STEP 1 — Navigate to login:
Go to https://secure.chase.com/web/auth/dashboard
If redirected, click "Sign In" in the top right corner.

${LOGIN_WAIT_BLOCK}

STEP 3 — Select the account:
On the dashboard, click on the primary checking account (or the first account listed if multiple exist).
This opens the transaction history for that account.

STEP 4 — Set the date range:
Click "Search or filter transactions" or the filter/calendar icon.
Choose a custom date range: start date = 90 days ago, end date = today.
Apply the filter.

STEP 5 — Extract all transactions:
Scroll down through the full list. If a "See more transactions" or load-more button appears,
click it repeatedly until no more appear.
Capture every transaction: posted date, description, amount, and debit vs credit.

STEP 6 — Return output:
${OUTPUT_FORMAT}
  `.trim(),

  golden1: `
You are helping a user export their Golden 1 Credit Union transactions into piggy.ai, a personal finance app.

STEP 1 — Navigate to login:
Go to https://www.golden1.com
Click "Online Banking Login" in the top navigation bar.
You will be redirected to the Golden 1 online banking portal.

${LOGIN_WAIT_BLOCK}

STEP 3 — Open transaction history:
Click on the primary checking or savings account name to open its detail view.
Look for an "Activity", "Transactions", or "Account History" tab and click it.

STEP 4 — Set the date range:
Find the date filter or search panel.
Set the start date to 90 days ago and end date to today.
Click "Search" or "Apply" to load the filtered results.

STEP 5 — Extract all transactions:
Scroll through all results. If there is a "Next" page or "Load More" option, click through
every page until all transactions in the 90-day window are visible.
Capture: date, description/merchant, amount, and whether each transaction is a debit or credit.

STEP 6 — Return output:
${OUTPUT_FORMAT}
  `.trim(),

  "bank of america": `
You are helping a user export their Bank of America transactions into piggy.ai, a personal finance app.

STEP 1 — Navigate to login:
Go to https://www.bankofamerica.com
Click "Sign In" in the top right corner, then select "Online Banking".

${LOGIN_WAIT_BLOCK}

STEP 3 — Open the account:
Click on the primary checking account (labeled "Bank of America Advantage" or similar).
This opens the account detail page with recent transactions.

STEP 4 — Set the date range:
Click on "Advanced Search" or the date range filter near the transaction list.
Set the From date to 90 days ago and the To date to today.
Click "Search" to apply.

STEP 5 — Extract all transactions:
Scroll through all results. Click "Next" or any pagination control to load additional pages
until all transactions are captured.
For each transaction capture: date posted, description, amount, and transaction type
(debit/withdrawal vs credit/deposit).

STEP 6 — Return output:
${OUTPUT_FORMAT}
  `.trim(),

  wells_fargo: `
You are helping a user export their Wells Fargo transactions into piggy.ai, a personal finance app.

STEP 1 — Navigate to login:
Go to https://www.wellsfargo.com
Click "Sign On" in the top right corner.

${LOGIN_WAIT_BLOCK}

STEP 3 — Open the account:
Click on the primary checking account from the account summary list.
This opens the account activity page.

STEP 4 — Set the date range:
On the account activity page, look for "Date Range" or "Customize" options.
Select a custom range: start date = 90 days ago, end date = today.
Click "Update" or "Search" to apply.

STEP 5 — Extract all transactions:
Scroll through and paginate through ALL results — click "Next" or "More" until every
transaction in the 90-day range has been loaded.
For each transaction capture: date, description, amount, and whether it is a debit
(withdrawal) or credit (deposit).

STEP 6 — Return output:
${OUTPUT_FORMAT}
  `.trim(),
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
      // Extended timeout so the session survives the user's login + 2FA window.
      // 600s = 10 minutes. Raise further if users need more time.
      timeout: 600,
      // Prevents BrowserUse from killing the session during idle login wait.
      keep_alive: true,
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

// Statuses BrowserUse may return while waiting on user login.
// These are non-terminal — keep polling, do not resolve or reject.
const WAITING_STATUSES = new Set(["waiting", "paused", "idle", "pending_user", "running"]);
const TERMINAL_STATUSES = new Set(["finished", "completed", "failed", "stopped"]);
const SUCCESS_STATUSES  = new Set(["finished", "completed"]);

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

        // Still waiting on user (login, 2FA, etc.) — keep polling silently.
        if (WAITING_STATUSES.has(status.status)) return;

        if (TERMINAL_STATUSES.has(status.status)) {
          clearInterval(interval);

          if (SUCCESS_STATUSES.has(status.status)) {
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

  if (/uber|lyft|bart|muni|gas|shell|chevron/.test(d))         return "Transport";
  if (/amazon|walmart|target|costco/.test(d))                   return "Shopping";
  if (/restaurant|mcdonald|chipotle|doordash|grubhub|coffee|starbucks/.test(d)) return "Food & Dining";
  if (/netflix|spotify|hulu|apple|disney/.test(d))             return "Subscriptions";
  if (/rent|apartment|landlord/.test(d))                        return "Housing";
  if (/venmo|zelle|transfer/.test(d))                           return "Transfer";
  if (/paycheck|salary|deposit|income/.test(d))                 return "Income";

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

// Validates step 1 (session launch) only — navigates to a harmless public page.
export async function createSessionLaunchTest(): Promise<string> {
  const response = await fetch(`${BU_API}/sessions`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      task: `Go to https://example.com and confirm the page title contains "Example Domain". Then stop.`,
      timeout: 60,
      keep_alive: false,
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
      timeout: 120,
      keep_alive: false,
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