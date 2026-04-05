import express from 'express';

const router = express.Router();
const API_BASE = 'https://api.browser-use.com/api/v3';

function getApiKey() {
  const key = process.env.BROWSER_USE_API_KEY || process.env.VITE_BROWSER_USE_KEY;
  if (!key) {
    throw new Error('BrowserUse API key is not configured. Set BROWSER_USE_API_KEY or VITE_BROWSER_USE_KEY in your environment.');
  }
  return key;
}

function browserUseHeaders(extraHeaders = {}) {
  return {
    'Content-Type': 'application/json',
    'X-Browser-Use-API-Key': getApiKey(),
    ...extraHeaders,
  };
}

function buildExtractionTask(bankName, bankUrl) {
  return `You are a financial data assistant helping a user securely export their bank transactions.

STEP 1: Navigate to ${bankUrl}
STEP 2: STOP and wait for the user to log in completely. Do NOT fill in any login fields or credentials. Do not attempt to bypass authentication.
STEP 3: After the user is logged in (you'll see an account overview or dashboard), navigate to the transaction history, statements, or account activity section.
STEP 4: Look for an export/download option. Prefer CSV if available. If not, scrape the visible transaction data directly from the page.
STEP 5: Collect all transactions available (aim for last 90 days minimum).

Return ONLY valid JSON — no markdown, no explanation, just the JSON array:
[
  {
    "date": "YYYY-MM-DD",
    "description": "merchant or transaction name",
    "amount": -49.99,
    "category": "Food",
    "bank": "${bankName}"
  }
]

Rules:
- Negative amounts = money leaving the account (purchases, bills, fees)
- Positive amounts = money coming in (deposits, refunds, transfers in)
- Category must be one of: Income, Housing, Food, Transport, Entertainment, Shopping, Healthcare, Subscriptions, Other
- If you cannot find transaction data after login, return an empty array: []
`.trim();
}

function buildOutputSchema() {
  return {
    type: 'array',
    items: {
      type: 'object',
      properties: {
        date: { type: 'string' },
        description: { type: 'string' },
        amount: { type: 'number' },
        category: { type: 'string' },
        bank: { type: 'string' },
      },
      required: ['date', 'description', 'amount', 'category', 'bank'],
    },
  };
}

async function browserUseFetch(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: browserUseHeaders(options.headers),
  });

  const bodyText = await response.text();
  let body;
  try {
    body = bodyText ? JSON.parse(bodyText) : null;
  } catch {
    body = bodyText;
  }

  return { ok: response.ok, status: response.status, body };
}

router.post('/start', async (req, res) => {
  const { bankId, bankName, bankUrl } = req.body;
  if (!bankId || !bankName || !bankUrl) {
    return res.status(400).json({ error: 'bankId, bankName, and bankUrl are required.' });
  }

  try {
    const payload = {
      task: buildExtractionTask(bankName, bankUrl),
      model: 'claude-sonnet-4.6',
      keepAlive: false,
      maxCostUsd: 10,
      outputSchema: buildOutputSchema(),
      proxyCountryCode: 'us',
      enableRecording: false,
    };

    const result = await browserUseFetch('/sessions', {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    if (!result.ok) {
      const errorBody = typeof result.body === 'object' ? result.body : { error: result.body || 'BrowserUse API request failed' };
      return res.status(result.status).json(errorBody);
    }

    return res.json({
      sessionId: result.body.id,
      status: result.body.status,
      liveUrl: result.body.liveUrl,
      title: result.body.title,
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

router.get('/status/:sessionId', async (req, res) => {
  const { sessionId } = req.params;
  if (!sessionId) {
    return res.status(400).json({ error: 'sessionId is required.' });
  }

  try {
    const result = await browserUseFetch(`/sessions/${sessionId}`, {
      method: 'GET',
    });

    if (!result.ok) {
      const errorBody = typeof result.body === 'object' ? result.body : { error: result.body || 'BrowserUse API request failed' };
      return res.status(result.status).json(errorBody);
    }

    return res.json(result.body);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

export default router;
