import type { Transaction } from './browserUseService';

const API_URL = (import.meta.env.VITE_API_URL ?? '').replace(/\/$/, '');

export const parseBankStatementPDF = async (file: File): Promise<Transaction[]> => {
  // Convert to base64 so we can send as JSON (avoids multipart CORS issues)
  const base64Pdf = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve((reader.result as string).split(',')[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

  const response = await fetch(`${API_URL}/api/chat/parse-statement`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ base64Pdf })
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || 'Failed to parse PDF through backend proxy');
  }

  return data.transactions;
};

export interface ChatMessage {
  role: 'user' | 'model';
  parts: { text: string }[];
}

export const sendGeminiChat = async (
  history: ChatMessage[],
  newMessage: string,
  tone: string
): Promise<string> => {
  const response = await fetch(`${API_URL}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message: newMessage,
      tone,
      history: history.map(msg => ({
        role: msg.role,
        text: msg.parts[0].text
      }))
    })
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || 'Failed to send chat message.');
  }

  return data.reply;
};
