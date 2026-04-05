// src/services/browserUseService.ts
//
// LOGIN ARCHITECTURE — two sessions per bank:
//
//   Session A  "navigate"  → goes to the bank login page, clicks Sign In, then STOPS.
//                            The browser stays open (keep_alive: true).
//                            Your UI shows a "I'm logged in — continue" button.
//
//   Session B  "extract"   → resumes in the same browser context (connected_session_id),
//                            assumes dashboard is already loaded, runs full extraction.
//
// This removes any need for the agent to "wait" for the user, which caused BrowserUse
// to either time out immediately or spin in an infinite DOM-polling loop.

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

// ── Output schema ─────────────────────────────────────────────────────────────

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
Positive amounts only — use "type" to distinguish debits vs credits.
Paginate through ALL pages before returning. Do not stop at the first page.
`.trim();

// ── Per-bank config ───────────────────────────────────────────────────────────

interface BankConfig {
  // Session A: navigate to login page and stop. Browser stays open.
  navigatePrompt: string;
  // Session B: user is already logged in — extract transactions and return JSON.
  extractPrompt: string;
}

const BANK_CONFIGS: Record<string, BankConfig> = {
  citibank: {
    navigatePrompt: `
Go to https://online.citibank.com/US/JPS/portal/Index.do and click "Sign On".
Once the login form is visible and ready for the user to type into, stop immediately.
Do not fill in any credentials. Do not click anything else.
Output exactly the text: READY_FOR_LOGIN
    `.trim(),

    extractPrompt: `
The user is already logged into Citi online banking. You are on the account dashboard.

STEP 1 — Open the account:
Click the primary checking or savings account to open its transaction list.

STEP 2 — Set date range:
Find the date filter or "Search Transactions" option.
Set start date to 90 days ago, end date to today. Apply.

STEP 3 — Extract all transactions:
Paginate through every page (click "Show More" / "Next" until none remain).
Capture each row: date, description, amount, debit or credit.

STEP 4 — Return output:
${OUTPUT_FORMAT}
    `.trim(),
  },

  chase: {
    navigatePrompt: `
Go to https://secure.chase.com/web/auth/dashboard.
If redirected to a marketing page, click "Sign In" in the top right corner.
Once the username/password form is visible and ready for input, stop immediately.
Do not fill in any credentials. Do not click anything else.
Output exactly the text: READY_FOR_LOGIN
    `.trim(),

    extractPrompt: `
The user is already logged into Chase. You are on the account dashboard.

STEP 1 — Open the account:
Click the primary checking account tile on the dashboard.

STEP 2 — Set date range:
Click the filter or calendar icon near the transaction list.
Set a custom range: 90 days ago to today. Apply.

STEP 3 — Extract all transactions:
Click "See more transactions" or any load-more control until all transactions are visible.
Capture each row: posted date, description, amount, debit or credit.

STEP 4 — Return output:
${OUTPUT_FORMAT}
    `.trim(),
  },

  golden1: {
    navigatePrompt: `
Go to https://www.golden1.com and click "Online Banking Login" in the top navigation.
Once the login form is visible and ready for the user to type into, stop immediately.
Do not fill in any credentials. Do not click anything else.
Output exactly the text: READY_FOR_LOGIN
    `.trim(),

    extractPrompt: `
The user is already logged into Golden 1 Credit Union. You are on the account dashboard.

STEP 1 — Open the account:
Click the primary checking or savings account name.
Find the "Activity", "Transactions", or "Account History" tab and click it.

STEP 2 — Set date range:
Find the date filter. Set start date to 90 days ago, end date to today. Apply.

STEP 3 — Extract all transactions:
Paginate through all pages until every transaction in the 90-day window is loaded.
Capture each row: date, description, amount, debit or credit.

STEP 4 — Return output:
${OUTPUT_FORMAT}
    `.trim(),
  },

  "bank of america": {
    navigatePrompt: `
Go to https://www.bankofamerica.com and click "Sign In", then "Online Banking".
Once the login form is visible and ready for the user to type into, stop immediately.
Do not fill in any credentials. Do not click anything else.
Output exactly the text: READY_FOR_LOGIN
    `.trim(),

    extractPrompt: `
The user is already logged into Bank of America. You are on the account dashboard.

STEP 1 — Open the account:
Click the primary checking account (e.g. "Bank of America Advantage").

STEP 2 — Set date range:
Click "Advanced Search" or the date filter near the transaction list.
Set From date to 90 days ago, To date to today. Click Search.

STEP 3 — Extract all transactions:
Click "Next" or any pagination control until all transactions are loaded.
Capture each row: posted date, description, amount, debit or credit.

STEP 4 — Return output:
${OUTPUT_FORMAT}
    `.trim(),
  },

  wells_fargo: {
    navigatePrompt: `
Go to https://www.wellsfargo.com and click "Sign On" in the top right corner.
Once the login form is visible and ready for the user to type into, stop immediately.
Do not fill in any credentials. Do not click anything else.
Output exactly the text: READY_FOR_LOGIN
    `.trim(),

    extractPrompt: `
The user is already logged into Wells Fargo. You are on the account dashboard.

STEP 1 — Open the account:
Click the primary checking account from the account summary list.

STEP 2 — Set date range:
Find "Date Range" or "Customize" on the account activity page.
Set a custom range: 90 days ago to today. Click Update or Search.

STEP 3 — Extract all transactions:
Click "Next" or "More" until every transaction in the range is loaded.
Capture each row: date, description, amount, debit or credit.

STEP 4 — Return output:
${OUTPUT_FORMAT}
    `.trim(),
  },
};

// ── Types ─────────────────────────────────────────────────────────────────────

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

// ── Internal helpers ──────────────────────────────────────────────────────────

async function parseErrorResponse(response: Response): Promise<string> {
  const text = await response.text();
  try {
    const json = JSON.parse(text);
    return json.error || json.detail || text;
  } catch {
    return text;
  }
}

async function createSession(
  task: string,
  keepAlive: boolean,
  timeoutSecs: number,
  connectedSessionId?: string
): Promise<string> {
  const body: Record<string, unknown> = {
    task,
    timeout: timeoutSecs,
    keep_alive: keepAlive,
  };

  // Session B: reconnect to the browser left open by Session A
  if (connectedSessionId) {
    body.connected_session_id = connectedSessionId;
  }

  const response = await fetch(`${BU_API}/sessions`, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errBody = await parseErrorResponse(response);
    throw new Error(`Failed to create session (${response.status}): ${errBody}`);
  }

  const data = await response.json();
  const sessionId = data.id ?? data.sessionId;
  if (!sessionId) throw new Error("BrowserUse did not return a session ID");
  return sessionId;
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * SESSION A — navigate to the bank login page and stop.
 * The browser stays alive. Call createExtractionTask() after the user confirms login.
 * Store the returned sessionId — Session B needs it to reconnect to the same browser.
 */
export async function createLoginNavigationTask(bank: string): Promise<string> {
  const config = BANK_CONFIGS[bank.toLowerCase()];
  if (!config) throw new Error(`Unsupported bank: ${bank}`);
  return createSession(config.navigatePrompt, true, 120);
}

/**
 * SESSION B — reconnect to the open browser from Session A and extract transactions.
 * Only call this after the user has confirmed they are fully logged in.
 */
export async function createExtractionTask(bank: string, navigationSessionId: string): Promise<string> {
  const config = BANK_CONFIGS[bank.toLowerCase()];
  if (!config) throw new Error(`Unsupported bank: ${bank}`);
  return createSession(config.extractPrompt, false, 300, navigationSessionId);
}

/**
 * Legacy single-session entry point — kept for backward compatibility.
 * Prefer createLoginNavigationTask + createExtractionTask for new flows.
 */
export async function createBankTask(bank: string): Promise<string> {
  return createLoginNavigationTask(bank);
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
    // best-effort cleanup — don't throw
  }
}

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

// ── Parsing & utilities ───────────────────────────────────────────────────────

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

// ── Canonical categories ──────────────────────────────────────────────────────

export const CANONICAL_CATEGORIES = [
  "Food & Dining",
  "Housing",
  "Shopping",
  "Transport",
  "Subscriptions",
  "Income",
  "Other",
] as const;

export type Category = (typeof CANONICAL_CATEGORIES)[number];

/**
 * Maps any raw category string (from Gemini, BrowserUse, or CSV) to one of
 * the 7 canonical categories. Handles real-world bank statement variants like
 * "Groceries", "Supermarket", "Bills", "Mortgage", "Cash Withdrawal", etc.
 */
export function normalizeCategory(raw: string): Category {
  if (!raw) return "Other";
  const c = raw.trim().toLowerCase();

  // Already canonical — fast path
  const exact: Record<string, Category> = {
    "food & dining": "Food & Dining",
    "housing":       "Housing",
    "shopping":      "Shopping",
    "transport":     "Transport",
    "transportation":"Transport",
    "subscriptions": "Subscriptions",
    "subscription":  "Subscriptions",
    "income":        "Income",
    "other":         "Other",
  };
  if (exact[c]) return exact[c];

  // Food & Dining
  if (/grocer|grocery|supermarket|food|dining|restaurant|cafe|coffee|meal|bakery|diner|sushi|pizza|taco|doordash|grubhub|chipotle|mcdonald|starbucks|tim horton/.test(c))
    return "Food & Dining";

  // Housing
  if (/mortgage|rent|landlord|apartment|condo|property tax|strata|hydro|utility|utilities|electric|water bill|heat|home insurance/.test(c))
    return "Housing";

  // Transport
  if (/transport|auto & transport|automobile|vehicle|car payment|gas station|fuel|parking|transit|bus pass|train|subway|uber|lyft|taxi|muni|bart|metro/.test(c))
    return "Transport";

  // Shopping
  if (/shopping|retail|merchandise|electronics|clothing|apparel|department|amazon|walmart|target|costco|ebay|etsy|best buy|hardware/.test(c))
    return "Shopping";

  // Subscriptions
  if (/subscri|streaming|software|membership|netflix|spotify|hulu|disney|youtube|prime|apple music|icloud|gym|fitness club/.test(c))
    return "Subscriptions";

  // Income — payroll, deposits, refunds paid back to the account
  if (/income|payroll|salary|wages|paycheck|direct deposit|freelance|e-transfer in|refund|rebate|cashback|interest earned|dividend/.test(c))
    return "Income";

  // Everything else: fees, ATM, transfers, insurance, cheques, bills, etc.
  return "Other";
}

/**
 * Fallback categorizer when no category is provided at all — uses the
 * transaction description to infer a canonical category.
 * Handles real bank statement descriptions like "Interac Purchase - SUPERMARKET".
 */
function categorize(description: string): Category {
  const d = description.toLowerCase();
  if (/uber|lyft|bart|muni|gas|shell|chevron/.test(d))                          return "Transport";
  if (/amazon|walmart|target|costco/.test(d))                                    return "Shopping";
  if (/restaurant|mcdonald|chipotle|doordash|grubhub|coffee|starbucks/.test(d)) return "Food & Dining";
  if (/netflix|spotify|hulu|apple|disney/.test(d))                              return "Subscriptions";
  if (/rent|apartment|landlord/.test(d))                                         return "Housing";
  if (/venmo|zelle|transfer/.test(d))                                            return "Transfer";
  if (/paycheck|salary|deposit|income/.test(d))                                  return "Income";
  return "Other";
}

export function transactionsToCSV(transactions: Transaction[]): string {
  const header = "date,description,amount,type,category,bank";
  const rows = transactions.map((t) => {
    const escaped = (t.description ?? "").replace(/"/g, '""');
    return `${t.date},"${escaped}",${t.amount},${t.type},${t.category},${t.bank}`;
  });
  return [header, ...rows].join("\n");
}

// ── Test utilities ────────────────────────────────────────────────────────────

export async function createSessionLaunchTest(): Promise<string> {
  return createSession(
    `Go to https://example.com and confirm the page title contains "Example Domain". Then stop.`,
    false,
    60
  );
}

export async function createDemoLoginTask(): Promise<string> {
  return createSession(
    `
Go to https://the-internet.herokuapp.com/login.
Fill username with "tomsmith" and password with "SuperSecretPassword!".
Click the login button. Confirm the page shows "Secure Area".
Then go to https://the-internet.herokuapp.com/download.
Click any .csv file. Extract and return its text content.
    `.trim(),
    false,
    120
  );
}

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
  const hdrs = lines[0].split(",");
  return lines.slice(1).map((line) => {
    const values = line.split(",");
    const row: Record<string, string> = {};
    hdrs.forEach((h, i) => { row[h.trim()] = (values[i] ?? "").trim(); });
    return {
      date: row.date || "",
      description: row.description || "",
      amount: Math.abs(parseFloat(row.amount) || 0),
      type: row.type === "credit" ? "credit" : "debit",
      category: normalizeCategory(row.category || categorize(row.description || "")),
      bank: row.bank || bank,
    };
  });
}

export function saveTransactionsToStorage(transactions: Transaction[]): void {
  const existing: Transaction[] = JSON.parse(
    localStorage.getItem("piggy_transactions") || "[]"
  );
  const merged = [...existing, ...transactions.map(t => ({ ...t, category: normalizeCategory(t.category) }))];
  const seen = new Set<string>();
  const deduped = merged.filter((t) => {
    const key = `${t.date}-${t.description}-${t.amount}-${t.bank}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
  localStorage.setItem("piggy_transactions", JSON.stringify(deduped));
}