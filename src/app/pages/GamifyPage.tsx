import { useState } from 'react';
import { Trophy, Target, Plus } from 'lucide-react';

const savingsRate = 26.2; // percent — drives pig size

const goals = [
  { id: 1, label: 'Emergency Fund', target: 18000, current: 7666, emoji: '🛡️' },
  { id: 2, label: 'Vacation Fund', target: 3000, current: 1200, emoji: '✈️' },
  { id: 3, label: 'New Laptop', target: 2000, current: 1850, emoji: '💻' },
];

const achievements = [
  { id: 2, emoji: '🐷', label: 'First Oink', desc: 'Uploaded your first bank statement', earned: true },
  { id: 3, emoji: '💰', label: 'Saver Rookie', desc: 'Hit 20%+ savings rate', earned: true },
  { id: 4, emoji: '📊', label: 'Data Nerd', desc: 'Checked dashboard 10 times', earned: true },
  { id: 5, emoji: '🏆', label: 'Budget Boss', desc: 'Hit 30%+ savings rate', earned: false },
  { id: 6, emoji: '🚀', label: 'Escape Velocity', desc: 'Saved $10k total', earned: false },
  { id: 7, emoji: '💎', label: 'Diamond Pig', desc: 'Maintain 25%+ for 6 months', earned: false },
  { id: 8, emoji: '🧠', label: 'Finance Genius', desc: 'FICO score above 780', earned: false },
];

// Pig size: 0–100% savings rate → small to very chonky
function PigMascot({ savingsRate }: { savingsRate: number }) {
  const size = Math.min(180, 80 + savingsRate * 3.8);
  const chonk = savingsRate / 100;

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative" style={{ width: size, height: size }}>
        {/* Body */}
        <svg viewBox="0 0 100 100" width={size} height={size}>
          {/* Shadow */}
          <ellipse cx="50" cy="92" rx={30 + chonk * 8} ry="5" fill="#e0e0e0" />
          {/* Body */}
          <ellipse
            cx="50"
            cy={55 - chonk * 5}
            rx={32 + chonk * 12}
            ry={28 + chonk * 12}
            fill="#f8b4c8"
          />
          {/* Head */}
          <circle cx="50" cy={28 - chonk * 3} r={22 + chonk * 4} fill="#f8b4c8" />
          {/* Ears */}
          <ellipse cx={32 - chonk * 2} cy={14 - chonk * 2} rx="8" ry="10" fill="#f8b4c8" />
          <ellipse cx={68 + chonk * 2} cy={14 - chonk * 2} rx="8" ry="10" fill="#f8b4c8" />
          <ellipse cx={32 - chonk * 2} cy={14 - chonk * 2} rx="5" ry="7" fill="#f4a0bc" />
          <ellipse cx={68 + chonk * 2} cy={14 - chonk * 2} rx="5" ry="7" fill="#f4a0bc" />
          {/* Snout */}
          <ellipse cx="50" cy={34 - chonk * 2} rx="10" ry="8" fill="#f4a0bc" />
          <circle cx="47" cy={33 - chonk * 2} r="2.5" fill="#c87898" />
          <circle cx="53" cy={33 - chonk * 2} r="2.5" fill="#c87898" />
          {/* Eyes */}
          <circle cx={43 - chonk} cy={23 - chonk * 2} r="2.5" fill="#2d2d2d" />
          <circle cx={57 + chonk} cy={23 - chonk * 2} r="2.5" fill="#2d2d2d" />
          <circle cx={43.8 - chonk} cy={22.2 - chonk * 2} r="0.8" fill="white" />
          <circle cx={57.8 + chonk} cy={22.2 - chonk * 2} r="0.8" fill="white" />
          {/* Cheek blush */}
          <ellipse cx={38 - chonk} cy={27 - chonk * 2} rx="4" ry="2.5" fill="#f4a0bc" opacity="0.6" />
          <ellipse cx={62 + chonk} cy={27 - chonk * 2} rx="4" ry="2.5" fill="#f4a0bc" opacity="0.6" />
          {/* Legs */}
          <rect x={30 - chonk * 3} y={74 + chonk * 3} width={10 + chonk * 4} height="12" rx="5" fill="#f4a0bc" />
          <rect x={60 + chonk * 3} y={74 + chonk * 3} width={10 + chonk * 4} height="12" rx="5" fill="#f4a0bc" />
          {/* Tail */}
          <path d={`M ${78 + chonk * 6} ${55 - chonk * 3} Q 90 45 85 40 Q 80 35 86 30`} stroke="#f4a0bc" strokeWidth="3" fill="none" strokeLinecap="round" />
          {/* Coin slot (piggy bank) */}
          <rect x="44" y={42 - chonk * 3} width="12" height="2.5" rx="1" fill="#c87898" />
        </svg>
      </div>
      <div className="text-center">
        <div className="text-sm text-[#5a5a5a]">
          {savingsRate < 10 && 'Hungry piggy 😰 — feed me savings!'}
          {savingsRate >= 10 && savingsRate < 20 && 'Getting there... keep feeding! 🐷'}
          {savingsRate >= 20 && savingsRate < 30 && 'Looking healthy! Nice work 😊'}
          {savingsRate >= 30 && savingsRate < 40 && 'A chonky pig is a happy pig 🐷✨'}
          {savingsRate >= 40 && 'MAXIMUM CHONK. Financial legend! 🏆'}
        </div>
        <div className="text-xs text-[#57886c] mt-1">Savings rate: {savingsRate}%</div>
      </div>
    </div>
  );
}

export function GamifyPage() {
  return (
    <div className="p-6">
      <div className="mb-8">
        <h2 className="text-2xl tracking-tight">Goals & Rewards</h2>
        <p className="text-[#5a5a5a] text-sm mt-1">Save more, grow your pig, unlock achievements</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Pig mascot */}
        <div className="lg:col-span-1 flex flex-col gap-6">
          <div className="bg-white border border-[#e0e0e0] rounded-lg p-6 flex flex-col items-center gap-4">
            <h3 className="text-base self-start">Your Piggy</h3>
            <PigMascot savingsRate={savingsRate} />
            <div className="w-full">
              <div className="flex justify-between text-xs text-[#5a5a5a] mb-1">
                <span>Chonk level</span>
                <span>{savingsRate}%</span>
              </div>
              <div className="w-full bg-[#e0e0e0] rounded-full h-2">
                <div
                  className="h-2 rounded-full bg-[#57886c] transition-all"
                  style={{ width: `${Math.min(savingsRate / 40 * 100, 100)}%` }}
                />
              </div>
              <div className="flex justify-between text-xs text-[#5a5a5a] mt-1">
                <span>Skinny</span>
                <span>Max Chonk (40%+)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Goals + Achievements */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          {/* Savings Goals */}
          <div className="bg-white border border-[#e0e0e0] rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base flex items-center gap-2">
                <Target className="w-4 h-4 text-[#57886c]" />
                Savings Goals
              </h3>
              <button className="flex items-center gap-1 text-sm text-[#57886c] hover:text-[#466060] transition-colors">
                <Plus className="w-4 h-4" />
                Add Goal
              </button>
            </div>
            <div className="flex flex-col gap-5">
              {goals.map((goal) => {
                const pct = Math.min((goal.current / goal.target) * 100, 100);
                const remaining = goal.target - goal.current;
                return (
                  <div key={goal.id}>
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{goal.emoji}</span>
                        <span className="text-sm">{goal.label}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-sm text-[#57886c]">${goal.current.toLocaleString()}</span>
                        <span className="text-sm text-[#5a5a5a]"> / ${goal.target.toLocaleString()}</span>
                      </div>
                    </div>
                    <div className="w-full bg-[#e0e0e0] rounded-full h-2.5">
                      <div
                        className="h-2.5 rounded-full transition-all"
                        style={{
                          width: `${pct}%`,
                          backgroundColor: pct >= 100 ? '#57886c' : pct >= 60 ? '#81a684' : '#fbbf24',
                        }}
                      />
                    </div>
                    <div className="flex justify-between mt-1">
                      <span className="text-xs text-[#5a5a5a]">{pct.toFixed(0)}% complete</span>
                      {remaining > 0
                        ? <span className="text-xs text-[#5a5a5a]">${remaining.toLocaleString()} to go</span>
                        : <span className="text-xs text-[#57886c]">Goal reached! 🎉</span>
                      }
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Achievements */}
          <div className="bg-white border border-[#e0e0e0] rounded-lg p-6">
            <h3 className="text-base mb-4 flex items-center gap-2">
              <Trophy className="w-4 h-4 text-[#fbbf24]" />
              Achievements
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {achievements.map((a) => (
                <div
                  key={a.id}
                  className={`flex flex-col items-center text-center p-3 rounded-lg border transition-colors ${a.earned
                    ? 'bg-[#57886c]/10 border-[#57886c]/30'
                    : 'bg-[#f5f5f0] border-[#e0e0e0] opacity-50'
                    }`}
                >
                  <div className={`text-2xl mb-1 ${!a.earned && 'grayscale'}`}>{a.emoji}</div>
                  <div className="text-xs font-medium text-[#1a1a1a]">{a.label}</div>
                  <div className="text-xs text-[#5a5a5a] mt-0.5">{a.desc}</div>
                  {a.earned && (
                    <div className="mt-1.5 text-xs text-[#57886c]">Earned ✓</div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}