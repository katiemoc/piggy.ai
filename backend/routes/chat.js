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

router.post('/', async (req, res) => {
  const { message, tone = 'immigrant', history = [] } = req.body;
  if (!message) return res.status(400).json({ error: 'Message is required' });

  try {
    const model = genAI.getGenerativeModel({
      model: 'gemini-1.5-flash',
      systemInstruction: `${BASE_PROMPT}\n\n${tonePrompts[tone] ?? tonePrompts.immigrant}`,
    });

    const chat = model.startChat({
      history: history.map(msg => ({
        role: msg.role,
        parts: [{ text: msg.text }],
      })),
    });

    const result = await chat.sendMessage(message);
    res.json({ reply: result.response.text() });
  } catch (err) {
    console.error('Gemini error:', err);
    res.status(500).json({ error: 'Failed to get response from Piggy' });
  }
});

export default router;
