import { useState } from 'react';
import { Zap } from 'lucide-react';

type Tone = 'immigrant' | 'wallstreet' | 'buddhist';

export function AIAnalysisPanel() {
  const [selectedTone, setSelectedTone] = useState<Tone>('immigrant');
  const [analyzed, setAnalyzed] = useState(false);

  const tones: { id: Tone; emoji: string; label: string }[] = [
    { id: 'immigrant', emoji: '😤', label: 'Immigrant Parent' },
    { id: 'wallstreet', emoji: '📈', label: 'Wall Street Bro' },
    { id: 'buddhist', emoji: '🧘', label: 'Buddhist Monk' },
  ];

  const handleAnalyze = () => {
    setAnalyzed(true);
  };

  const getAnalysis = () => {
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
            'Material possessions do not bring lasting joy. Observe the $720 spent on shopping.',
            'Let go of the need for more. Your savings practice shows the beginning of wisdom.',
            'Mindfulness with each transaction. Ask: does this serve my higher purpose?',
          ],
        };
    }
  };

  const analysis = getAnalysis();

  return (
    <div className="bg-white border border-[#e0e0e0] rounded-lg p-6 mb-8">
      <h3 className="text-lg mb-4">AI Financial Analysis</h3>

      {/* Tone Selection */}
      <div className="flex gap-2 mb-4">
        {tones.map((tone) => (
          <button
            key={tone.id}
            onClick={() => setSelectedTone(tone.id)}
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
          className="w-full bg-[#57886c] text-white px-6 py-3 rounded-lg hover:bg-[#466060] transition-colors flex items-center justify-center gap-2"
        >
          <Zap className="w-5 h-5" />
          <span>Analyze My Finances</span>
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
