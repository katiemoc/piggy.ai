import express from 'express';
import { GoogleGenerativeAI } from '@google/generative-ai';

const router = express.Router();
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const tonePrompts = {
  immigrant: `You are Piggy in "Immigrant Parent" mode — a tough-love financial advisor who is blunt, slightly exasperated, and deeply practical. You reference sacrifice and hard work. You are direct and occasionally dramatic but always give solid, actionable advice.`,
  financebro: `You are Piggy in "Finance Bro" mode — an energetic, jargon-savvy financial advisor who talks about alpha, opportunity cost, and optimizing. You use terms like "chief", "let's get it", and reference specific strategies like index funds, tax-loss harvesting, etc.`,
  bestie: `You are Piggy in "Supportive Bestie" mode — a warm, encouraging financial advisor who is non-judgmental and uses casual language. You use emojis occasionally and always validate feelings before giving advice.`,
};

const BASE_PROMPT = `You are Piggy, a brutally honest AI financial advisor built into piggy.ai.
Help users understand their spending, savings, and financial health.
Keep responses concise and conversational. Use short paragraphs — no walls of text.
If asked about anything unrelated to personal finance, gently redirect to financial topics.`;

router.post('/parse-statement', async (req, res) => {
  const { base64Pdf } = req.body;
  if (!base64Pdf) return res.status(400).json({ error: 'PDF data is required' });

  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    const prompt = `You are a financial data extraction assistant. I will provide a bank statement PDF.
Your job is to parse the statement and extract ALL transactions into a JSON array perfectly matching this format:
[
  {
    "date": "YYYY-MM-DD",
    "description": "merchant or payee name",
    "amount": 0.00,
    "type": "debit",
    "category": "Food & Dining",
    "bank": "Uploaded PDF"
  }
]
Rules:
- "type" must be exactly "debit" (money out) or "credit" (money in). Nothing else.
- "amount" must be a positive number regardless of debit/credit.
- "category" must be EXACTLY one of these 7 values — no other values allowed:
  Food & Dining, Housing, Shopping, Transport, Subscriptions, Income, Other
  Use these mappings:
  - Groceries, supermarket, restaurant, cafe, coffee, food → Food & Dining
  - Mortgage, rent, landlord, hydro, utilities, home → Housing
  - Retail, electronics, clothing, department store, amazon → Shopping
  - Gas, fuel, parking, transit, uber, lyft, auto → Transport
  - Netflix, Spotify, streaming, gym, membership, software → Subscriptions
  - Payroll, salary, direct deposit, income, paycheck → Income
  - ATM, fees, insurance, transfer, cheque, bill payment, credit card payment → Other
- Provide ONLY the valid JSON array, with absolutely no markdown, backticks, or explanation.`;

    const result = await model.generateContent([
      { inlineData: { data: base64Pdf, mimeType: 'application/pdf' } },
      prompt,
    ]);

    const rawText = result.response.text();
    const cleanJson = rawText.replace(/```json/g, '').replace(/```/g, '').trim();
    res.json({ transactions: JSON.parse(cleanJson) });
  } catch (err) {
    console.error('Gemini Parse error:', err);
    res.status(500).json({ error: err?.message || 'Failed to parse PDF' });
  }
});

router.post('/', async (req, res) => {
  const { message, tone = 'immigrant', history = [] } = req.body;
  if (!message) return res.status(400).json({ error: 'Message is required' });

  try {
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash',
      systemInstruction: `${BASE_PROMPT}\n\n${tonePrompts[tone] ?? tonePrompts.immigrant}`,
    });

    // Gemini requires history to alternate user/model, starting with user
    const geminiHistory = history
      .map(msg => ({
        role: msg.role === 'user' ? 'user' : 'model',
        parts: [{ text: msg.text }],
      }))
      .filter((_, i, arr) => {
        // Drop leading bot messages — history must start with user
        if (i === 0 && arr[0].role === 'model') return false;
        return true;
      });

    const chat = model.startChat({ history: geminiHistory });

    const result = await chat.sendMessage(message);
    res.json({ reply: result.response.text() });
  } catch (err) {
    console.error('Gemini error:', err);
    const msg = err?.message ?? String(err);
    res.status(500).json({ error: msg });
  }
});

router.post('/parse-statement', async (req, res) => {
  const { base64Pdf } = req.body;
  if (!base64Pdf) return res.status(400).json({ error: 'PDF data is required' });

  try {
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash',
    });

    const prompt = `You are a financial data extraction assistant. I will provide a bank statement PDF.
Your job is to parse the statement and extract ALL transactions into a JSON array perfectly matching this format:
[
  {
    "date": "2026-04-12",
    "description": "Trader Joes",
    "amount": 80.5,
    "type": "debit",
    "category": "Food & Dining",
    "bank": "Uploaded PDF"
  }
]
Valid types are strictly "debit" or "credit". Ensure proper category guessing.
Provide ONLY the valid JSON, with absolutely no markdown formatting, backticks, or explanation.`;

    const result = await model.generateContent([
      { inlineData: { data: base64Pdf, mimeType: 'application/pdf' } },
      prompt
    ]);

    const rawText = result.response.text();
    const cleanJson = rawText.replace(/```json/g, '').replace(/```/g, '').trim();
    res.json({ transactions: JSON.parse(cleanJson) });
  } catch (err) {
    console.error('Gemini Parse error:', err);
    res.status(500).json({ error: err?.message || 'Failed to parse PDF' });
  }
});

export default router;
