import { useNavigate } from 'react-router';
import { TrendingUp, AlertTriangle, CheckCircle, Info, Settings } from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine,
} from 'recharts';
import { useTone, Tone } from '../context/ToneContext';

const projectionData = [
  { month: 'Apr', actual: 7666, projected: null },
  { month: 'May', actual: null, projected: 9800 },
  { month: 'Jun', actual: null, projected: 12100 },
  { month: 'Jul', actual: null, projected: 14300 },
  { month: 'Aug', actual: null, projected: 16600 },
  { month: 'Sep', actual: null, projected: 19000 },
  { month: 'Oct', actual: null, projected: 21500 },
];

const analyses: Record<Tone, {
  score: number;
  verdict: string;
  good: string[];
  bad: string[];
  tips: string[];
  fico: string;
}> = {
  immigrant: {
    score: 62,
    verdict: 'Not bad, but not good enough',
    good: [
      'You saved 26% this month. Not 40%, but it\'s something.',
      'Income went up 12%. Finally, a raise. Only took how long?',
    ],
    bad: [
      '$480 on entertainment?! In my country, we entertained ourselves for free.',
      '$720 on shopping. You have enough clothes. Enough!',
    ],
    tips: [
      'Cut entertainment to $200. Put the rest in savings. No negotiation.',
      'Cook at home every day. $850 on food is embarrassing.',
      'Your savings rate should be 40% minimum. Double your effort.',
    ],
    fico: 'Pay your credit card IN FULL every month. Late payments are shameful and expensive. Set up autopay now.',
  },
  financebro: {
    score: 71,
    verdict: 'Decent fundamentals, massive alpha left on table',
    good: [
      '12% income growth MoM — solid trajectory, keep compounding.',
      'Net position of $2,216 shows positive cash flow. Build on this.',
    ],
    bad: [
      'Entertainment ROI: literally zero. Reallocate to index funds.',
      'Shopping spend is leakage. Every $720 uninvested = ~$7,200 lost over 10 years at 10% APY.',
    ],
    tips: [
      'Max your 401k to $23,500. It\'s free money via tax reduction, chief.',
      'Set up automatic DCA into VOO or VTI. Emotion out, system in.',
      'Emergency fund target: 6 months expenses = ~$37,400. Stack it.',
    ],
    fico: 'FICO is your leverage score. Keep utilization under 10%, not 30%. Every point above 750 saves you thousands on your next mortgage.',
  },
  bestie: {
    score: 58,
    verdict: 'Okay bestie, we need to talk — with love 💕',
    good: [
      'You\'re saving! 26% is honestly impressive, I\'m proud of you.',
      'Your income is going up! That hard work is paying off, sis.',
    ],
    bad: [
      'That $720 shopping spree though... were you okay? Emotional spending?',
      'Food is $850 — girl are you okay or are you stress-eating? (no judgment)',
    ],
    tips: [
      'Try a "no-spend weekend" challenge once a month — make it fun!',
      'Set a "fun money" budget: $200/month guilt-free, then stop. Boundaries!',
      'Automate $500/month to savings so you never even see it. Out of sight, out of mind.',
    ],
    fico: 'Think of your credit score like your reputation — it takes time to build but seconds to hurt. Keep balances low and pay on time, always. You\'ve got this! ✨',
  },
};

const toneLabels: Record<Tone, { emoji: string; label: string }> = {
  immigrant: { emoji: '😤', label: 'Immigrant Parent' },
  financebro: { emoji: '📈', label: 'Finance Bro' },
  bestie: { emoji: '💕', label: 'Supportive Bestie' },
};

export function AIPage() {
  const { tone } = useTone();
  const navigate = useNavigate();
  const analysis = analyses[tone];
  const toneLabel = toneLabels[tone];

  const scoreColor =
    analysis.score >= 70 ? '#57886c' : analysis.score >= 50 ? '#fbbf24' : '#c0392b';

  return (
    <div className="p-6 max-w-4xl">
      <div className="mb-6 flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-2xl tracking-tight">AI Analysis</h2>
          <p className="text-[#5a5a5a] text-sm mt-1">Your finances, brutally dissected</p>
        </div>

        {/* Active tone badge + profile link */}
        <button
          onClick={() => navigate('/profile')}
          className="flex items-center gap-2 px-3 py-2 bg-white border border-[#e0e0e0] rounded-lg hover:border-[#57886c] transition-colors text-sm text-[#5a5a5a] shrink-0"
        >
          <span>{toneLabel.emoji}</span>
          <span>{toneLabel.label}</span>
          <Settings className="w-3.5 h-3.5 ml-1 text-[#b0b0b0]" />
        </button>
      </div>

      {/* Score + Verdict */}
      <div className="bg-white border border-[#e0e0e0] rounded-lg p-6 mb-6">
        <div className="flex flex-col sm:flex-row gap-6">
          {/* Score */}
          <div className="flex flex-col items-center justify-center bg-[#f5f5f0] border border-[#e0e0e0] rounded-lg p-6 min-w-[140px]">
            <div className="text-5xl mb-1" style={{ color: scoreColor }}>{analysis.score}</div>
            <div className="text-xs text-[#5a5a5a]">/ 100</div>
            <div className="mt-3 w-full bg-[#e0e0e0] rounded-full h-1.5">
              <div
                className="h-1.5 rounded-full transition-all"
                style={{ width: `${analysis.score}%`, backgroundColor: scoreColor }}
              />
            </div>
          </div>

          {/* Verdict */}
          <div className="flex-1">
            <p className="text-base mb-1" style={{ color: scoreColor }}>"{analysis.verdict}"</p>
            <p className="text-xs text-[#5a5a5a] mb-4">Based on April 2026 · Sample Data</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <div className="flex items-center gap-1 text-xs text-[#57886c] mb-2">
                  <CheckCircle className="w-3 h-3" /> What you're doing right
                </div>
                {analysis.good.map((g, i) => (
                  <p key={i} className="text-xs text-[#1a1a1a] mb-1.5">✓ {g}</p>
                ))}
              </div>
              <div>
                <div className="flex items-center gap-1 text-xs text-[#c0392b] mb-2">
                  <AlertTriangle className="w-3 h-3" /> What needs work
                </div>
                {analysis.bad.map((b, i) => (
                  <p key={i} className="text-xs text-[#1a1a1a] mb-1.5">✗ {b}</p>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3 Action Items */}
      <div className="bg-white border border-[#e0e0e0] rounded-lg p-6 mb-6">
        <h3 className="text-base mb-4 flex items-center gap-2">
          <span style={{ color: scoreColor }}>⚡</span>
          3 Specific Action Items
        </h3>
        <div className="flex flex-col gap-3">
          {analysis.tips.map((tip, i) => (
            <div key={i} className="flex gap-4 p-4 bg-[#f5f5f0] rounded-lg">
              <div className="w-6 h-6 rounded-full bg-[#57886c] text-white flex items-center justify-center text-xs shrink-0">
                {i + 1}
              </div>
              <p className="text-sm text-[#1a1a1a]">{tip}</p>
            </div>
          ))}
        </div>
      </div>

      {/* 6-Month Projection */}
      <div className="bg-white border border-[#e0e0e0] rounded-lg p-6 mb-6">
        <h3 className="text-base mb-1 flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-[#57886c]" />
          6-Month Balance Projection
        </h3>
        <p className="text-xs text-[#5a5a5a] mb-4">Assuming current savings rate of 26.2%</p>
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={projectionData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
            <XAxis dataKey="month" stroke="#5a5a5a" style={{ fontSize: '12px' }} />
            <YAxis stroke="#5a5a5a" style={{ fontSize: '12px' }} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
            <Tooltip
              contentStyle={{ backgroundColor: '#fff', border: '1px solid #e0e0e0', borderRadius: '8px' }}
              formatter={(v: number) => `$${v.toLocaleString()}`}
            />
            <ReferenceLine x="Apr" stroke="#5a5a5a" strokeDasharray="3 3" label={{ value: 'Today', position: 'top', fontSize: 10, fill: '#5a5a5a' }} />
            <Line type="monotone" dataKey="actual" stroke="#57886c" strokeWidth={2} dot={{ fill: '#57886c', r: 4 }} connectNulls={false} isAnimationActive={false} name="Actual" />
            <Line type="monotone" dataKey="projected" stroke="#57886c" strokeWidth={2} strokeDasharray="6 4" dot={{ fill: '#57886c', r: 4 }} connectNulls isAnimationActive={false} name="Projected" />
          </LineChart>
        </ResponsiveContainer>
        <p className="text-xs text-[#5a5a5a] mt-3 text-center">
          At this rate, you'll have <span className="text-[#57886c]">$21,500</span> by October 2026
        </p>
      </div>

      {/* FICO Score */}
      <div className="bg-white border border-[#e0e0e0] rounded-lg p-6">
        <h3 className="text-base mb-4 flex items-center gap-2">
          <Info className="w-4 h-4 text-[#57886c]" />
          FICO Score Improvement
        </h3>
        <div className="flex flex-col sm:flex-row gap-6 items-start">
          <div className="flex flex-col items-center bg-[#f5f5f0] border border-[#e0e0e0] rounded-lg p-5 min-w-[140px]">
            <div className="text-xs text-[#5a5a5a] mb-1">Est. FICO Score</div>
            <div className="text-4xl text-[#57886c]">712</div>
            <div className="text-xs text-[#5a5a5a] mt-1">Good range</div>
            <div className="mt-3 w-full">
              {[
                { label: 'Poor', color: '#c0392b', range: '300–579' },
                { label: 'Fair', color: '#e8924a', range: '580–669' },
                { label: 'Good', color: '#fbbf24', range: '670–739' },
                { label: 'Very Good', color: '#81a684', range: '740–799' },
                { label: 'Exceptional', color: '#57886c', range: '800–850' },
              ].map((band) => (
                <div key={band.label} className="flex items-center gap-2 mb-1">
                  <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: band.color }} />
                  <div className="text-xs text-[#5a5a5a]">{band.label}</div>
                </div>
              ))}
            </div>
          </div>
          <div className="flex-1">
            <p className="text-sm text-[#1a1a1a] mb-4">{analysis.fico}</p>
            <div className="flex flex-col gap-2">
              {[
                { factor: 'Payment History', pct: 35, score: 'On time ✓', good: true },
                { factor: 'Credit Utilization', pct: 30, score: '42% — too high', good: false },
                { factor: 'Credit Age', pct: 15, score: '4.2 years avg', good: true },
                { factor: 'Credit Mix', pct: 10, score: 'Cards + loan ✓', good: true },
                { factor: 'New Inquiries', pct: 10, score: '1 recent', good: true },
              ].map((f) => (
                <div key={f.factor} className="flex items-center gap-3">
                  <div className="text-xs text-[#5a5a5a] w-32 shrink-0">{f.factor} ({f.pct}%)</div>
                  <div className="flex-1 h-1.5 bg-[#e0e0e0] rounded-full">
                    <div
                      className="h-1.5 rounded-full"
                      style={{ width: `${f.pct * 2}%`, backgroundColor: f.good ? '#57886c' : '#c0392b' }}
                    />
                  </div>
                  <div className={`text-xs shrink-0 ${f.good ? 'text-[#57886c]' : 'text-[#c0392b]'}`}>
                    {f.score}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
