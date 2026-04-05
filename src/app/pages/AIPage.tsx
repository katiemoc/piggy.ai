import { useMemo } from 'react';
import { useNavigate } from 'react-router';
import { TrendingUp, AlertTriangle, CheckCircle, Settings, Upload } from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine,
} from 'recharts';
import { useTone, Tone } from '../context/ToneContext';
import { useTransactions } from '../hooks/useTransactions';

const toneLabels: Record<Tone, { emoji: string; label: string }> = {
  immigrant: { emoji: '😤', label: 'Immigrant Parent' },
  financebro: { emoji: '📈', label: 'Finance Bro' },
  bestie: { emoji: '💕', label: 'Supportive Bestie' },
};

const toneVerdict: Record<Tone, (score: number) => string> = {
  immigrant: (s) => s >= 70 ? 'Acceptable. Now do better.' : s >= 50 ? 'Not bad, but not good enough' : 'This is embarrassing. We need to talk.',
  financebro: (s) => s >= 70 ? 'Solid fundamentals, keep compounding' : s >= 50 ? 'Decent fundamentals, massive alpha left on table' : 'Portfolio is bleeding. Time to pivot.',
  bestie: (s) => s >= 70 ? 'Okay you\'re actually doing amazing 💕' : s >= 50 ? 'Okay bestie, we need to talk — with love 💕' : 'Hey no judgment but... we really need to chat 💕',
};


const toneTips: Record<Tone, (topCat: string, savingsRate: number, target: number) => string[]> = {
  immigrant: (topCat, rate, target) => [
    `Cut ${topCat} spending. Every dollar saved is a dollar earned — in my day we did not spend like this.`,
    rate < target ? `Your savings rate should be ${target}% minimum. Cook at home. Stop buying things you do not need.` : `Keep saving. ${target}% is the target — maintain it.`,
    'Set up automatic transfers to savings on payday. If you never see it, you cannot spend it.',
  ],
  financebro: (topCat, rate, target) => [
    `${topCat} is your biggest leak. Optimize it like a hedge fund optimizes fees — ruthlessly.`,
    rate < target ? 'Max your 401k to $23,500. It\'s free money via tax reduction, chief.' : 'You\'re saving well. Now make that cash work — DCA into VOO or VTI monthly.',
    'Emergency fund target: 6 months expenses. Stack it, then invest the overflow.',
  ],
  bestie: (topCat, rate, target) => [
    `${topCat} is where most of your money is going. Maybe try a "no-spend week" and see how it feels! 🌟`,
    rate < target ? 'Automate a savings transfer on payday so you never even see it. Out of sight, out of mind!' : 'You\'re saving so well! Keep going — maybe bump it up by just 2% more?',
    'Set a "fun money" budget and stick to it. Guilt-free spending within limits is totally healthy. Boundaries!',
  ],
};

function fmt(n: number) {
  return '$' + n.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

export function AIPage() {
  const { tone } = useTone();
  const navigate = useNavigate();
  const transactions = useTransactions();
  const toneLabel = toneLabels[tone];

  const stats = useMemo(() => {
    if (transactions.length === 0) return null;

    const savingsTarget = (() => {
      const stored = localStorage.getItem('piggy_savings_target');
      return stored ? Number(stored) : 30;
    })();

    const income = transactions.filter(t => t.type === 'credit').reduce((s, t) => s + t.amount, 0);
    const expenses = transactions.filter(t => t.type === 'debit').reduce((s, t) => s + t.amount, 0);
    const net = income - expenses;
    const savingsRate = income > 0 ? (net / income) * 100 : 0;

    // Score: 40 base + up to 55 from savings rate, capped 10–95
    const score = Math.min(95, Math.max(10, Math.round(40 + savingsRate * 1.5)));

    // Top spending category
    const catSpend: Record<string, number> = {};
    for (const t of transactions.filter(t => t.type === 'debit')) {
      catSpend[t.category] = (catSpend[t.category] ?? 0) + t.amount;
    }
    const sortedCats = Object.entries(catSpend).sort(([, a], [, b]) => b - a);
    const topCat = sortedCats[0]?.[0] ?? 'Other';
    const topCatAmount = sortedCats[0]?.[1] ?? 0;

    // Good/bad points based on real data
    const good: string[] = [];
    const bad: string[] = [];

    if (savingsRate >= savingsTarget) good.push(`Saving ${savingsRate.toFixed(1)}% of income — above your ${savingsTarget}% target.`);
    else if (savingsRate > 0) good.push(`You have a positive net — ${fmt(net)} left over after expenses.`);
    if (income > 0) good.push(`Total income: ${fmt(income)}.`);
    if (good.length < 2) good.push('You\'re tracking your finances — that\'s already more than most people do.');

    if (savingsRate < savingsTarget) bad.push(`Savings rate is ${savingsRate.toFixed(1)}% — your target is ${savingsTarget}%.`);
    if (topCatAmount > 0) bad.push(`${fmt(topCatAmount)} spent on ${topCat} — your biggest expense category.`);
    if (bad.length < 2 && expenses > 0) bad.push(`Total spent: ${fmt(expenses)}. Review each category for cuts.`);

    // Monthly breakdown for chart
    const byMonth: Record<string, { income: number; expenses: number }> = {};
    for (const t of transactions) {
      const key = t.date?.slice(0, 7);
      if (!key) continue;
      if (!byMonth[key]) byMonth[key] = { income: 0, expenses: 0 };
      if (t.type === 'credit') byMonth[key].income += t.amount;
      else byMonth[key].expenses += t.amount;
    }

    const sortedMonths = Object.entries(byMonth).sort(([a], [b]) => a.localeCompare(b));
    let cumulative = 0;
    const actualData = sortedMonths.map(([key, m]) => {
      cumulative += m.income - m.expenses;
      const [year, month] = key.split('-');
      const label = new Date(Number(year), Number(month) - 1, 1)
        .toLocaleDateString('en-US', { month: 'short' });
      return { month: label, actual: Math.round(cumulative), projected: null as number | null };
    });

    // Project 6 months forward from average monthly net
    const avgMonthlyNet = sortedMonths.length > 0
      ? sortedMonths.reduce((s, [, m]) => s + m.income - m.expenses, 0) / sortedMonths.length
      : 0;

    const lastDate = sortedMonths.length > 0 ? sortedMonths[sortedMonths.length - 1][0] : null;
    const projectionData = [...actualData];
    if (lastDate && avgMonthlyNet !== 0) {
      let projCumulative = cumulative;
      const [lastYear, lastMonth] = lastDate.split('-').map(Number);
      for (let i = 1; i <= 6; i++) {
        const d = new Date(lastYear, lastMonth - 1 + i, 1);
        const label = d.toLocaleDateString('en-US', { month: 'short' });
        projCumulative += avgMonthlyNet;
        projectionData.push({ month: label, actual: null as unknown as number, projected: Math.round(projCumulative) });
      }
    }

    const todayLabel = actualData[actualData.length - 1]?.month ?? '';

    return { income, expenses, net, savingsRate, score, topCat, good, bad, projectionData, todayLabel, avgMonthlyNet, savingsTarget };
  }, [transactions]);

  const scoreColor = !stats ? '#b0b0b0'
    : stats.score >= 70 ? '#57886c'
    : stats.score >= 50 ? '#fbbf24'
    : '#c0392b';

  if (transactions.length === 0) {
    return (
      <div className="p-6 w-full">
        <div className="mb-6 flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h2 className="text-2xl tracking-tight">AI Analysis</h2>
            <p className="text-[#5a5a5a] text-sm mt-1">Your finances, brutally dissected</p>
          </div>
          <button
            onClick={() => navigate('/profile')}
            className="flex items-center gap-2 px-3 py-2 bg-white border border-[#e0e0e0] rounded-lg hover:border-[#57886c] transition-colors text-sm text-[#5a5a5a] shrink-0"
          >
            <span>{toneLabel.emoji}</span>
            <span>{toneLabel.label}</span>
            <Settings className="w-3.5 h-3.5 ml-1 text-[#b0b0b0]" />
          </button>
        </div>
        <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
          <div className="text-4xl">🐷</div>
          <p className="text-[#1a1a1a]">No data to analyze yet</p>
          <p className="text-sm text-[#5a5a5a]">Upload a statement or add transactions manually to get your analysis.</p>
          <button
            onClick={() => navigate('/upload')}
            className="mt-2 flex items-center gap-2 px-5 py-2.5 bg-[#57886c] text-white rounded-lg text-sm hover:bg-[#466060] transition-colors"
          >
            <Upload className="w-4 h-4" />
            Add Transactions
          </button>
        </div>
      </div>
    );
  }

  const score = stats!.score;
  const verdict = toneVerdict[tone](score);
  const tips = toneTips[tone](stats!.topCat, stats!.savingsRate, stats!.savingsTarget);


  return (
    <div className="p-6 w-full">
      <div className="mb-6 flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-2xl tracking-tight">AI Analysis</h2>
          <p className="text-[#5a5a5a] text-sm mt-1">Your finances, brutally dissected</p>
        </div>
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
          <div className="flex flex-col items-center justify-center bg-[#f5f5f0] border border-[#e0e0e0] rounded-lg p-6 min-w-[140px]">
            <div className="text-5xl mb-1" style={{ color: scoreColor }}>{score}</div>
            <div className="text-xs text-[#5a5a5a]">/ 100</div>
            <div className="mt-3 w-full bg-[#e0e0e0] rounded-full h-1.5">
              <div className="h-1.5 rounded-full transition-all" style={{ width: `${score}%`, backgroundColor: scoreColor }} />
            </div>
          </div>
          <div className="flex-1">
            <p className="text-base mb-1" style={{ color: scoreColor }}>"{verdict}"</p>
            <p className="text-xs text-[#5a5a5a] mb-4">Based on {transactions.length} transactions · {stats!.savingsRate.toFixed(1)}% savings rate</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <div className="flex items-center gap-1 text-xs text-[#57886c] mb-2">
                  <CheckCircle className="w-3 h-3" /> What you're doing right
                </div>
                {stats!.good.map((g, i) => (
                  <p key={i} className="text-xs text-[#1a1a1a] mb-1.5">✓ {g}</p>
                ))}
              </div>
              <div>
                <div className="flex items-center gap-1 text-xs text-[#c0392b] mb-2">
                  <AlertTriangle className="w-3 h-3" /> What needs work
                </div>
                {stats!.bad.map((b, i) => (
                  <p key={i} className="text-xs text-[#1a1a1a] mb-1.5">✗ {b}</p>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Action Items */}
      <div className="bg-white border border-[#e0e0e0] rounded-lg p-6 mb-6">
        <h3 className="text-base mb-4 flex items-center gap-2">
          <span style={{ color: scoreColor }}>⚡</span>
          3 Specific Action Items
        </h3>
        <div className="flex flex-col gap-3">
          {tips.map((tip, i) => (
            <div key={i} className="flex gap-4 p-4 bg-[#f5f5f0] rounded-lg">
              <div className="w-6 h-6 rounded-full bg-[#57886c] text-white flex items-center justify-center text-xs shrink-0">{i + 1}</div>
              <p className="text-sm text-[#1a1a1a]">{tip}</p>
            </div>
          ))}
        </div>
      </div>

      {/* 6-Month Projection */}
      {stats!.projectionData.length > 0 && (
        <div className="bg-white border border-[#e0e0e0] rounded-lg p-6 mb-6">
          <h3 className="text-base mb-1 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-[#57886c]" />
            Cumulative Balance + 6-Month Projection
          </h3>
          <p className="text-xs text-[#5a5a5a] mb-4">
            Assuming avg monthly net of {fmt(Math.round(stats!.avgMonthlyNet))}
          </p>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={stats!.projectionData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
              <XAxis dataKey="month" stroke="#5a5a5a" style={{ fontSize: '12px' }} />
              <YAxis stroke="#5a5a5a" style={{ fontSize: '12px' }} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
              <Tooltip
                contentStyle={{ backgroundColor: '#fff', border: '1px solid #e0e0e0', borderRadius: '8px' }}
                formatter={(v: number) => `$${v.toLocaleString()}`}
              />
              {stats!.todayLabel && (
                <ReferenceLine x={stats!.todayLabel} stroke="#5a5a5a" strokeDasharray="3 3"
                  label={{ value: 'Today', position: 'top', fontSize: 10, fill: '#5a5a5a' }} />
              )}
              <Line type="monotone" dataKey="actual" stroke="#57886c" strokeWidth={2} dot={{ fill: '#57886c', r: 4 }} connectNulls={false} isAnimationActive={false} name="Actual" />
              <Line type="monotone" dataKey="projected" stroke="#57886c" strokeWidth={2} strokeDasharray="6 4" dot={{ fill: '#57886c', r: 4 }} connectNulls isAnimationActive={false} name="Projected" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

    </div>
  );
}
