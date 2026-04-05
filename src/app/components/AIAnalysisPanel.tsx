import { useState } from 'react';
import { Zap, Loader2 } from 'lucide-react';
import type { Transaction } from '../services/browserUseService';

type Tone = 'immigrant' | 'wallstreet' | 'buddhist';

interface Props {
  transactions?: Transaction[];
}

export function AIAnalysisPanel({ transactions }: Props) {
  const [selectedTone, setSelectedTone] = useState<Tone>('immigrant');
  const [analyzed, setAnalyzed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [aiResult, setAiResult] = useState<{ score: number; verdict: string; tips: string[] } | null>(null);

  const tones: { id: Tone; emoji: string; label: string }[] = [
    { id: 'immigrant',  emoji: '😤', label: 'Immigrant Parent' },
    { id: 'wallstreet', emoji: '📈', label: 'Wall Street Bro' },
    { id: 'buddhist',   emoji: '🧘', label: 'Buddhist Monk' },
  ];

  // Fallback hardcoded analysis
  const getFallback = () => {
    switch (selectedTone) {
      case 'immigrant':
        return {
          score: 62,
          verdict: 'Not terrible, but you could do better',
          tips: [
            'You spent $480 on entertainment? In my day, we entertained ourselves with a stick and a rock.',
            'Save 40% minimum. 26% is rookie numbers. You think money grows on trees?',
            'Stop buying coffee outside. Make it at home. $5 a day = $1,825 a year wasted.',
          ],
        };
      case 'wallstreet':
        return {
          score: 71,
          verdict: 'Decent fundamentals, room for alpha',
          tips: [
            'Your savings rate is underperforming the market. Need to hit 35%+ for exponential wealth accumulation.',
            'Reallocate entertainment spend to index funds. ROI on Netflix: 0%. ROI on S&P 500: ~10% annually.',
            "Leverage your income growth trajectory. You're leaving money on the table, chief.",
          ],
        };
      case 'buddhist':
        return {
          score: 58,
          verdict: 'The path is before you, but attachment remains',
          tips: [
            'Material possessions do not bring lasting joy. Observe your shopping habits.',
            'Let go of the need for more. Your savings practice shows the beginning of wisdom.',
            'Mindfulness with each transaction. Ask: does this serve my higher purpose?',
          ],
        };
    }
  };

  const handleAnalyze = async () => {
    setLoading(true);
    setAnalyzed(false);

    // If we have real transactions + Gemini key, call the API
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    if (transactions && transactions.length > 0 && apiKey) {
      try {
        // Build aggregated summary (never send raw transactions)
        const income = transactions.filter(t => t.type === 'credit').reduce((s, t) => s + t.amount, 0);
        const expenses = transactions.filter(t => t.type === 'debit').reduce((s, t) => s + t.amount, 0);
        const byCategory = transactions
          .filter(t => t.type === 'debit')
          .reduce((acc, t) => { acc[t.category] = (acc[t.category] || 0) + t.amount; return acc; }, {} as Record<string, number>);

        const toneInstructions = {
          immigrant: 'You are a tough but loving immigrant parent. Be harsh, guilt-trip them, but ultimately want them to succeed. Use phrases like "In my day..." and "You think money grows on trees?"',
          wallstreet: 'You are an aggressive Wall Street bro. Talk about ROI, alpha, leverage, and beating the market. Use finance bro slang.',
          buddhist: 'You are a calm Buddhist monk. Talk about attachment, mindfulness, and the impermanence of material things.',
        };

        const prompt = `
          ${toneInstructions[selectedTone]}
          
          Analyze this college student's finances and respond with ONLY valid JSON:
          - Monthly income: $${income.toFixed(0)}
          - Monthly expenses: $${expenses.toFixed(0)}
          - Savings rate: ${income > 0 ? (((income - expenses) / income) * 100).toFixed(1) : 0}%
          - Spending by category: ${JSON.stringify(byCategory)}
          
          Respond with this exact JSON format:
          {"score": <0-100>, "verdict": "<one sentence>", "tips": ["<tip1>", "<tip2>", "<tip3>"]}
        `;

        const res = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
          }
        );
        const data = await res.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          setAiResult(JSON.parse(jsonMatch[0]));
        } else {
          setAiResult(getFallback());
        }
      } catch {
        setAiResult(getFallback());
      }
    } else {
      // No real data or no API key — use hardcoded
      setAiResult(getFallback());
    }

    setLoading(false);
    setAnalyzed(true);
  };

  const analysis = aiResult || getFallback();

  return (
    <div className="bg-white border border-[#e0e0e0] rounded-lg p-6 mb-8">
      <h3 className="text-lg mb-4">AI Financial Analysis</h3>

      {/* Tone Selection */}
      <div className="flex gap-2 mb-4">
        {tones.map((tone) => (
          <button
            key={tone.id}
            onClick={() => { setSelectedTone(tone.id); setAnalyzed(false); setAiResult(null); }}
            className={`flex-1 px-4 py-2 rounded-lg transition-colors border ${
              selectedTone === tone.id
                ? 'bg-[#57886c]/20 border-[#57886c] text-[#57886c]'
                : 'bg-[#f5f5f0] border-[#d0d0d0] text-[#5a5a5a] hover:border-[#57886c]'
            }`}
          >
            <span className="mr-2">{tone.emoji}</span>
            <span className="text-sm">{tone.label}</span>
          </button>
        ))}
      </div>

      {/* Analyze Button */}
      {!analyzed ? (
        <button
          onClick={handleAnalyze}
          disabled={loading}
          className="w-full bg-[#57886c] text-white px-6 py-3 rounded-lg hover:bg-[#466060] transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
        >
          {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Zap className="w-5 h-5" />}
          <span>{loading ? 'Analyzing...' : 'Analyze My Finances'}</span>
        </button>
      ) : (
        <div className="flex gap-6">
          {/* Score */}
          <div className="flex-shrink-0 flex flex-col items-center justify-center bg-[#f5f5f0] border border-[#e0e0e0] rounded-lg p-6 min-w-[160px]">
            <div className="text-6xl text-[#57886c] mb-2">{analysis.score}</div>
            <div className="text-sm text-[#5a5a5a]">/ 100</div>
          </div>

          {/* Verdict and Tips */}
          <div className="flex-1">
            <h4 className="text-lg text-[#57886c] mb-4">{analysis.verdict}</h4>
            <ul className="space-y-3">
              {analysis.tips.map((tip, index) => (
                <li key={index} className="flex gap-3">
                  <span className="text-[#57886c] flex-shrink-0">•</span>
                  <span className="text-sm text-[#1a1a1a]">{tip}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}