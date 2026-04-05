// src/services/browserUseService.ts

const BU_API = "https://api.browser-use.com/api/v3";

const API_KEY = import.meta.env.VITE_BROWSER_USE_API_KEY as string;
if (!API_KEY) console.warn("[BrowserUse] VITE_BROWSER_USE_API_KEY is not set");

const headers = {
  "X-Browser-Use-API-Key": API_KEY,
  "Content-Type": "application/json",
};

// Completion condition appended to every prompt so BrowserUse knows
// the task is NOT finished until both PDF and JSON are delivered.
const COMPLETION_CONDITION = `
IMPORTANT: This task is NOT complete until you have done ALL THREE of the following:
1. Downloaded the transactions PDF to the user's device.
2. Returned the full JSON array below.
Do not stop, report success, or mark the task done after login — logging in is only the beginning.

Return ONLY a raw JSON array (no markdown, no extra text) in this exact shape:
[{ "date": "YYYY-MM-DD", "description": "merchant or payee name", "amount": 0.00, "type": "debit" or "credit", "category": "Food & Dining | Shopping | Transport | Housing | Subscriptions | Income | Other" }]
Include ALL transactions. Positive amounts only — use "type" to distinguish debits vs credits. Paginate through every page before returning.
`.trim();

const BANK_INSTRUCTIONS: Record<string, string> = {
  citibank: `
Your goal is to download the last 90 days of Citi bank transactions as a PDF to the user's device and return them as structured JSON. This is one continuous task — do not stop after login.

Navigate to https://online.citibank.com/US/JPS/portal/Index.do and click "Sign On". Keep the browser open and wait — without pausing or stopping the session — until the user finishes logging in, including any OTP or 2FA prompt. You will know login is complete when the account dashboard showing balances appears.

Once the dashboard is visible, immediately click on the primary checking or savings account. Open the transaction history, find the date filter or search panel, and set the range to the last 90 days. Paginate through every page until all transactions are loaded.

Next, locate the Download or Export button near the transaction list. Select PDF if prompted. If no direct PDF option exists, use the Print function (Ctrl+P / Cmd+P) and save as PDF. Confirm the download so the file saves to the user's device.

${COMPLETION_CONDITION}
  `.trim(),

  chase: `
Your goal is to download the last 90 days of Chase bank transactions as a PDF to the user's device and return them as structured JSON. This is one continuous task — do not stop after login.

Navigate to https://secure.chase.com/web/auth/dashboard (or click "Sign In" if redirected). Keep the browser open and wait — without pausing or stopping the session — until the user finishes logging in, including any 2FA push notification. You will know login is complete when the Chase account dashboard with account tiles is fully visible.

Once the dashboard is visible, immediately click on the primary checking account to open its transaction history. Click the filter or calendar icon and set a custom date range: 90 days ago to today. Click "See more transactions" or any load-more control repeatedly until all results are showing.

Next, click the download arrow icon (labeled "Download") near the transaction list and select PDF. If PDF is not available, go to Statements in the left sidebar and download the relevant monthly statement as PDF instead. Confirm the download so the file saves to the user's device.

${COMPLETION_CONDITION}
  `.trim(),

  golden1: `
Your goal is to download the last 90 days of Golden 1 Credit Union transactions as a PDF to the user's device and return them as structured JSON. This is one continuous task — do not stop after login.

Navigate to https://www.golden1.com and click "Online Banking Login" in the top navigation. Keep the browser open and wait — without pausing or stopping the session — until the user finishes logging in, including any security question or OTP. You will know login is complete when the account summary page with balances is visible.

Once the dashboard is visible, immediately click on the primary checking or savings account, then click the Activity, Transactions, or Account History tab. Find the date filter and set the range to the last 90 days. Paginate through every page until all transactions are loaded.

Next, locate the Download, Export, or Print button near the transaction list. Select PDF if prompted. If no PDF option exists, navigate to the Statements section and download the most recent statement(s) as PDF, or use Ctrl+P / Cmd+P → Save as PDF on the transaction view. Confirm the download so the file saves to the user's device.

${COMPLETION_CONDITION}
  `.trim(),

  "bank of america": `
Your goal is to download the last 90 days of Bank of America transactions as a PDF to the user's device and return them as structured JSON. This is one continuous task — do not stop after login.

Navigate to https://www.bankofamerica.com and click "Sign In" then "Online Banking". Keep the browser open and wait — without pausing or stopping the session — until the user finishes logging in, including any 2-step verification or Erica prompt. You will know login is complete when the main accounts overview page with balances is loaded.

Once the dashboard is visible, immediately click on the primary checking account (labeled "Bank of America Advantage" or similar). Click "Advanced Search" or the date range filter and set From to 90 days ago, To to today. Click Search. Paginate through all results.

Next, click the download icon (downward arrow labeled "Download Transactions") near the transaction list and select PDF. If PDF is not available, go to Statements & Documents in the top navigation, find the statement covering the last 90 days, and download it as PDF. Confirm the download so the file saves to the user's device.

${COMPLETION_CONDITION}
  `.trim(),

  wells_fargo: `
Your goal is to download the last 90 days of Wells Fargo transactions as a PDF to the user's device and return them as structured JSON. This is one continuous task — do not stop after login.

Navigate to https://www.wellsfargo.com and click "Sign On". Keep the browser open and wait — without pausing or stopping the session — until the user finishes signing on, including any 2-step verification code. You will know login is complete when the Wells Fargo account summary page with balances is fully loaded.

Once the dashboard is visible, immediately click on the primary checking account to open the account activity page. Find the Date Range or Customize option and select a custom range: 90 days ago to today. Click Update or Search. Paginate through all results using Next or More until every transaction in the range is visible.

Next, click the Download Transactions link or downward arrow near the activity list and select PDF. If PDF is not available, go to Statements & Documents under the account menu, find the statement(s) covering the last 90 days, and download as PDF. Confirm the download so the file saves to the user's device.

${COMPLETION_CONDITION}
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

export async function createBankTask(bank: string): Promise<string> {
  const instruction = BANK_INSTRUCTIONS[bank.toLowerCase()];
  if (!instruction) throw new Error(`Unsupported bank: ${bank}`);

  const response = await fetch(`${BU_API}/sessions`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      task: instruction.trim(),
    }),
  });

  if (!response.ok) {
    const errBody = await response.text();
    throw new Error(`Failed to create session (${response.status}): ${errBody}`);
  }

  const data = await response.json();
  return data.id;
}

export async function getTaskStatus(sessionId: string): Promise<SessionStatus> {
  const response = await fetch(`${BU_API}/sessions/${sessionId}`, {
    method: "GET",
    headers,
  });

  if (!response.ok) {
    const errBody = await response.text();
    throw new Error(`Failed to get session status (${response.status}): ${errBody}`);
  }

  const data = await response.json();

  return {
    sessionId: data.id,
    status: data.status,
    liveUrl: data.live_url ?? data.liveUrl,
    output: data.output ?? data.result,
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

export async function resumeTask(sessionId: string): Promise<void> {
  const response = await fetch(`${BU_API}/sessions/${sessionId}/resume`, {
    method: "PUT",
    headers,
  });
  if (!response.ok) {
    const errBody = await response.text();
    throw new Error(`Failed to resume session (${response.status}): ${errBody}`);
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
    return raw.map((t: any) => ({
      date: t.date || "",
      description: t.description || t.merchant || "",
      amount: Math.abs(parseFloat(t.amount) || 0),
      type: t.type === "credit" ? "credit" : "debit",
      category: normalizeCategory(t.category || categorize(t.description || "")),
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

  // Income
  if (/payroll deposit|payroll|salary|direct deposit|e-transfer in|freelance/.test(d)) return "Income";

  // Housing
  if (/mortgage|rent|landlord|apartment|hydro|utilities/.test(d)) return "Housing";

  // Food & Dining — check merchant keyword after common prefixes like "Interac Purchase - "
  if (/supermarket|grocery|grocer|restaurant|mcdonald|chipotle|doordash|grubhub|coffee|starbucks|cafe|diner|sushi|pizza|taco|tim horton/.test(d)) return "Food & Dining";

  // Transport
  if (/uber|lyft|bart|muni|metro|gas station|fuel|shell|chevron|exxon|bp|parking|transit/.test(d)) return "Transport";

  // Shopping — electronics, retail, etc.
  if (/electronics|amazon|walmart|target|costco|ebay|etsy|best buy|shop|store|retail/.test(d)) return "Shopping";

  // Subscriptions
  if (/netflix|spotify|hulu|apple|disney|youtube|prime|subscription|membership/.test(d)) return "Subscriptions";

  // ATM, fees, transfers, insurance, cheques, bill payments → Other
  return "Other";
}

export function transactionsToCSV(transactions: Transaction[]): string {
  const header = "date,description,amount,type,category,bank";
  const rows = transactions.map(
    (t) =>
      `${t.date},"${t.description.replace(/"/g, '""')}",${t.amount},${t.type},${t.category},${t.bank}`
  );
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
      category: normalizeCategory(row.category || categorize(row.description || "")),
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
    const key = `${t.date}-${t.description}-${t.amount}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
  localStorage.setItem("piggy_transactions", JSON.stringify(deduped));
}