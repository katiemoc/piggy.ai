import type { Transaction } from './browserUseService';

const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';

export const parseBankStatementPDF = async (base64Pdf: string, apiKey: string): Promise<Transaction[]> => {
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

  const requestBody = {
    contents: [
      {
        parts: [
          { text: prompt },
          {
            inline_data: {
              mime_type: 'application/pdf',
              data: base64Pdf
            }
          }
        ]
      }
    ],
    generationConfig: {
      temperature: 0.1,
      response_mime_type: 'application/json'
    }
  };

  const response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(requestBody)
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to parse PDF with Gemini: ${errorText}`);
  }

  const result = await response.json();
  try {
    const rawText = result.candidates[0].content.parts[0].text;
    const cleanJson = rawText.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(cleanJson) as Transaction[];
  } catch (error) {
    console.error("Gemini Parse Error:", result);
    throw new Error("Unable to parse the financial data JSON from Gemini's response.");
  }
};

export interface ChatMessage {
  role: 'user' | 'model';
  parts: { text: string }[];
}

export const sendGeminiChat = async (
  history: ChatMessage[],
  newMessage: string,
  systemInstruction: string,
  apiKey: string
): Promise<string> => {
  const contents = [...history, { role: 'user', parts: [{ text: newMessage }] }];

  const requestBody = {
    contents,
    systemInstruction: {
      parts: [
        { text: systemInstruction }
      ]
    },
    generationConfig: {
      temperature: 0.7
    }
  };

  const response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(requestBody)
  });

  if (!response.ok) {
    throw new Error('Failed to send chat message.');
  }

  const result = await response.json();
  try {
    return result.candidates[0].content.parts[0].text;
  } catch (error) {
    throw new Error("Unable to parse the response from Gemini.");
  }
};
