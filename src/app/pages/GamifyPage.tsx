import { useState } from 'react';
import { Trophy, Target, Plus, Pencil, Trash2, X, Check } from 'lucide-react';

const savingsRate = 26.2;

interface Goal {
  id: number;
  label: string;
  target: number;
  current: number;
  emoji: string;
}

const DEFAULT_GOALS: Goal[] = [
  { id: 1, label: 'Emergency Fund', target: 18000, current: 7666, emoji: '🛡️' },
  { id: 2, label: 'Vacation Fund', target: 3000, current: 1200, emoji: '✈️' },
  { id: 3, label: 'New Laptop', target: 2000, current: 1850, emoji: '💻' },
];

const EMOJI_OPTIONS = ['🛡️', '✈️', '💻', '🏠', '🚗', '🎓', '💍', '🌴', '📱', '💊', '🐶', '🎸', '⚽', '🍕', '💰', '🚀'];

function loadGoals(): Goal[] {
  try {
    const stored = localStorage.getItem('piggy_goals');
    return stored ? JSON.parse(stored) : DEFAULT_GOALS;
  } catch {
    return DEFAULT_GOALS;
  }
}

function saveGoals(goals: Goal[]) {
  localStorage.setItem('piggy_goals', JSON.stringify(goals));
}

const achievements = [
  { id: 2, emoji: '🐷', label: 'First Oink', desc: 'Uploaded your first bank statement', earned: true },
  { id: 3, emoji: '💰', label: 'Saver Rookie', desc: 'Hit 20%+ savings rate', earned: true },
  { id: 4, emoji: '📊', label: 'Data Nerd', desc: 'Checked dashboard 10 times', earned: true },
  { id: 5, emoji: '🏆', label: 'Budget Boss', desc: 'Hit 30%+ savings rate', earned: false },
  { id: 6, emoji: '🚀', label: 'Escape Velocity', desc: 'Saved $10k total', earned: false },
  { id: 7, emoji: '💎', label: 'Diamond Pig', desc: 'Maintain 25%+ for 6 months', earned: false },
  { id: 8, emoji: '🧠', label: 'Finance Genius', desc: 'FICO score above 780', earned: false },
];

function PigMascot({ savingsRate }: { savingsRate: number }) {
  const size = Math.min(180, 80 + savingsRate * 3.8);
  const chonk = savingsRate / 100;

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative" style={{ width: size, height: size }}>
        <svg viewBox="0 0 100 100" width={size} height={size}>
          <ellipse cx="50" cy="92" rx={30 + chonk * 8} ry="5" fill="#e0e0e0" />
          <ellipse cx="50" cy={55 - chonk * 5} rx={32 + chonk * 12} ry={28 + chonk * 12} fill="#f8b4c8" />
          <circle cx="50" cy={28 - chonk * 3} r={22 + chonk * 4} fill="#f8b4c8" />
          <ellipse cx={32 - chonk * 2} cy={14 - chonk * 2} rx="8" ry="10" fill="#f8b4c8" />
          <ellipse cx={68 + chonk * 2} cy={14 - chonk * 2} rx="8" ry="10" fill="#f8b4c8" />
          <ellipse cx={32 - chonk * 2} cy={14 - chonk * 2} rx="5" ry="7" fill="#f4a0bc" />
          <ellipse cx={68 + chonk * 2} cy={14 - chonk * 2} rx="5" ry="7" fill="#f4a0bc" />
          <ellipse cx="50" cy={34 - chonk * 2} rx="10" ry="8" fill="#f4a0bc" />
          <circle cx="47" cy={33 - chonk * 2} r="2.5" fill="#c87898" />
          <circle cx="53" cy={33 - chonk * 2} r="2.5" fill="#c87898" />
          <circle cx={43 - chonk} cy={23 - chonk * 2} r="2.5" fill="#2d2d2d" />
          <circle cx={57 + chonk} cy={23 - chonk * 2} r="2.5" fill="#2d2d2d" />
          <circle cx={43.8 - chonk} cy={22.2 - chonk * 2} r="0.8" fill="white" />
          <circle cx={57.8 + chonk} cy={22.2 - chonk * 2} r="0.8" fill="white" />
          <ellipse cx={38 - chonk} cy={27 - chonk * 2} rx="4" ry="2.5" fill="#f4a0bc" opacity="0.6" />
          <ellipse cx={62 + chonk} cy={27 - chonk * 2} rx="4" ry="2.5" fill="#f4a0bc" opacity="0.6" />
          <rect x={30 - chonk * 3} y={74 + chonk * 3} width={10 + chonk * 4} height="12" rx="5" fill="#f4a0bc" />
          <rect x={60 + chonk * 3} y={74 + chonk * 3} width={10 + chonk * 4} height="12" rx="5" fill="#f4a0bc" />
          <path d={`M ${78 + chonk * 6} ${55 - chonk * 3} Q 90 45 85 40 Q 80 35 86 30`} stroke="#f4a0bc" strokeWidth="3" fill="none" strokeLinecap="round" />
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

interface GoalFormState {
  label: string;
  target: string;
  current: string;
  emoji: string;
}

const EMPTY_FORM: GoalFormState = { label: '', target: '', current: '', emoji: '💰' };

function GoalModal({
  initial,
  onSave,
  onClose,
}: {
  initial?: Goal;
  onSave: (data: GoalFormState) => void;
  onClose: () => void;
}) {
  const [form, setForm] = useState<GoalFormState>(
    initial
      ? { label: initial.label, target: String(initial.target), current: String(initial.current), emoji: initial.emoji }
      : EMPTY_FORM
  );
  const [error, setError] = useState('');

  const set = (key: keyof GoalFormState, val: string) => setForm((f) => ({ ...f, [key]: val }));

  const handleSave = () => {
    if (!form.label.trim()) { setError('Give your goal a name.'); return; }
    const t = parseFloat(form.target);
    const c = parseFloat(form.current);
    if (!form.target || isNaN(t) || t <= 0) { setError('Enter a valid target amount.'); return; }
    if (form.current && (isNaN(c) || c < 0)) { setError('Enter a valid current amount.'); return; }
    onSave(form);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30" onClick={onClose}>
      <div
        className="bg-white rounded-xl border border-[#e0e0e0] shadow-lg w-full max-w-sm mx-4 p-6 flex flex-col gap-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h3 className="text-base">{initial ? 'Edit Goal' : 'New Goal'}</h3>
          <button onClick={onClose} className="text-[#5a5a5a] hover:text-[#1a1a1a] p-1 rounded-lg hover:bg-[#f5f5f0] transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {error && (
          <div className="text-xs text-[#c0392b] bg-[#c0392b]/8 border border-[#c0392b]/20 rounded-lg px-3 py-2">
            {error}
          </div>
        )}

        {/* Emoji picker */}
        <div>
          <div className="text-sm mb-2">Emoji</div>
          <div className="flex flex-wrap gap-2">
            {EMOJI_OPTIONS.map((e) => (
              <button
                key={e}
                onClick={() => set('emoji', e)}
                className={`w-9 h-9 rounded-lg text-lg flex items-center justify-center border transition-colors ${
                  form.emoji === e ? 'border-[#57886c] bg-[#57886c]/10' : 'border-[#e0e0e0] hover:border-[#57886c]'
                }`}
              >
                {e}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-sm block mb-1.5">Goal name</label>
          <input
            value={form.label}
            onChange={(e) => set('label', e.target.value)}
            placeholder="e.g. Emergency Fund"
            className="w-full border border-[#e0e0e0] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#57886c]"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-sm block mb-1.5">Target ($)</label>
            <input
              type="number"
              min="0"
              value={form.target}
              onChange={(e) => set('target', e.target.value)}
              placeholder="10000"
              className="w-full border border-[#e0e0e0] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#57886c]"
            />
          </div>
          <div>
            <label className="text-sm block mb-1.5">Saved so far ($)</label>
            <input
              type="number"
              min="0"
              value={form.current}
              onChange={(e) => set('current', e.target.value)}
              placeholder="0"
              className="w-full border border-[#e0e0e0] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#57886c]"
            />
          </div>
        </div>

        <div className="flex gap-2 pt-1">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-[#e0e0e0] rounded-lg text-sm text-[#5a5a5a] hover:bg-[#f5f5f0] transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="flex-1 px-4 py-2 bg-[#57886c] text-white rounded-lg text-sm hover:bg-[#466060] transition-colors flex items-center justify-center gap-1.5"
          >
            <Check className="w-3.5 h-3.5" />
            {initial ? 'Save Changes' : 'Add Goal'}
          </button>
        </div>
      </div>
    </div>
  );
}

export function GamifyPage() {
  const [goals, setGoals] = useState<Goal[]>(loadGoals);
  const [modal, setModal] = useState<'add' | 'edit' | null>(null);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);

  const updateGoals = (next: Goal[]) => {
    setGoals(next);
    saveGoals(next);
  };

  const handleAdd = (form: GoalFormState) => {
    const next: Goal = {
      id: Date.now(),
      label: form.label.trim(),
      target: parseFloat(form.target),
      current: parseFloat(form.current) || 0,
      emoji: form.emoji,
    };
    updateGoals([...goals, next]);
    setModal(null);
  };

  const handleEdit = (form: GoalFormState) => {
    if (!editingGoal) return;
    updateGoals(goals.map((g) =>
      g.id === editingGoal.id
        ? { ...g, label: form.label.trim(), target: parseFloat(form.target), current: parseFloat(form.current) || 0, emoji: form.emoji }
        : g
    ));
    setModal(null);
    setEditingGoal(null);
  };

  const handleDelete = (id: number) => {
    updateGoals(goals.filter((g) => g.id !== id));
    setDeleteConfirm(null);
  };

  return (
    <div className="p-6">
      {modal === 'add' && (
        <GoalModal onSave={handleAdd} onClose={() => setModal(null)} />
      )}
      {modal === 'edit' && editingGoal && (
        <GoalModal initial={editingGoal} onSave={handleEdit} onClose={() => { setModal(null); setEditingGoal(null); }} />
      )}

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
              <button
                onClick={() => setModal('add')}
                className="flex items-center gap-1 text-sm text-[#57886c] hover:text-[#466060] transition-colors"
              >
                <Plus className="w-4 h-4" />
                Add Goal
              </button>
            </div>

            {goals.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 gap-3 text-center">
                <div className="text-3xl">🎯</div>
                <p className="text-sm text-[#5a5a5a]">No goals yet.</p>
                <p className="text-xs text-[#b0b0b0]">Add your first savings goal to start tracking.</p>
                <button
                  onClick={() => setModal('add')}
                  className="mt-1 flex items-center gap-1.5 text-sm text-[#57886c] hover:text-[#466060] px-3 py-2 rounded-lg hover:bg-[#f5f5f0] transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Add Goal
                </button>
              </div>
            ) : (
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
                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            <span className="text-sm text-[#57886c]">${goal.current.toLocaleString()}</span>
                            <span className="text-sm text-[#5a5a5a]"> / ${goal.target.toLocaleString()}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => { setEditingGoal(goal); setModal('edit'); }}
                              className="p-1 rounded-lg text-[#5a5a5a] hover:text-[#57886c] hover:bg-[#f5f5f0] transition-colors"
                              title="Edit"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            {deleteConfirm === goal.id ? (
                              <div className="flex items-center gap-1">
                                <button
                                  onClick={() => handleDelete(goal.id)}
                                  className="p-1 rounded-lg text-white bg-[#c0392b] hover:bg-[#a93226] transition-colors"
                                  title="Confirm delete"
                                >
                                  <Check className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => setDeleteConfirm(null)}
                                  className="p-1 rounded-lg text-[#5a5a5a] hover:bg-[#f5f5f0] transition-colors"
                                  title="Cancel"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => setDeleteConfirm(goal.id)}
                                className="p-1 rounded-lg text-[#5a5a5a] hover:text-[#c0392b] hover:bg-[#f5f5f0] transition-colors"
                                title="Delete"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
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
            )}
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
