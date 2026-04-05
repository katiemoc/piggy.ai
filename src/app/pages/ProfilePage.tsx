import { useState } from 'react';
import { useNavigate } from 'react-router';
import {
  Bell, Shield, Download, Trash2, ChevronRight,
  CreditCard, Target, Palette, Globe, LogOut, Edit2, Check,
} from 'lucide-react';
import { useTone, Tone } from '../context/ToneContext';
import { useAuth } from '../auth';

const toneOptions: { id: Tone; emoji: string; label: string }[] = [
  { id: 'immigrant', emoji: '😤', label: 'Immigrant Parent' },
  { id: 'financebro', emoji: '📈', label: 'Finance Bro' },
  { id: 'bestie', emoji: '💕', label: 'Supportive Bestie' },
];

const currencies = ['USD ($)', 'EUR (€)', 'GBP (£)', 'CAD (C$)', 'AUD (A$)', 'JPY (¥)'];

const uploadHistory = [
  { name: 'april_statement.csv', date: 'Apr 3, 2026', size: '12 KB', transactions: 47 },
  { name: 'march_credit.csv', date: 'Mar 31, 2026', size: '14 KB', transactions: 52 },
  { name: 'february_statement.csv', date: 'Feb 28, 2026', size: '11 KB', transactions: 39 },
  { name: 'january_statement.csv', date: 'Jan 31, 2026', size: '15 KB', transactions: 61 },
];

const healthHistory = [
  { month: 'Apr 2026', score: 62, color: '#fbbf24' },
  { month: 'Mar 2026', score: 55, color: '#fbbf24' },
  { month: 'Feb 2026', score: 68, color: '#fbbf24' },
  { month: 'Jan 2026', score: 45, color: '#c0392b' },
  { month: 'Dec 2025', score: 38, color: '#c0392b' },
  { month: 'Nov 2025', score: 72, color: '#57886c' },
];

function Toggle({ checked, onChange }: { checked: boolean; onChange: () => void }) {
  return (
    <button
      onClick={onChange}
      className={`w-10 h-5.5 rounded-full transition-colors relative ${checked ? 'bg-[#57886c]' : 'bg-[#d0d0d0]'}`}
      style={{ height: '22px', width: '40px' }}
    >
      <div
        className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${checked ? 'translate-x-5' : 'translate-x-0.5'}`}
      />
    </button>
  );
}

export function ProfilePage() {
  const navigate = useNavigate();
  const { tone: preferredTone, setTone: setPreferredTone } = useTone();
  const { user, logout, updateUser } = useAuth();
  const [currency, setCurrency] = useState('USD ($)');
  const [savingsTarget, setSavingsTarget] = useState(30);
  const [editingName, setEditingName] = useState(false);
  const [name, setName] = useState(user?.name ?? 'User');
  const [nameInput, setNameInput] = useState(user?.name ?? 'User');
  const [notifications, setNotifications] = useState({
    weeklyReport: true,
    spendingAlerts: true,
    goalMilestones: true,
    aiTips: false,
  });

  const toggleNotif = (key: keyof typeof notifications) => {
    setNotifications((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const avgScore = Math.round(healthHistory.reduce((a, b) => a + b.score, 0) / healthHistory.length);

  return (
    <div className="p-6 max-w-4xl">
      <div className="mb-8">
        <h2 className="text-2xl tracking-tight">Profile</h2>
        <p className="text-[#5a5a5a] text-sm mt-1">All the nitty gritty — your settings, history, and data</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column */}
        <div className="flex flex-col gap-6">
          {/* Avatar card */}
          <div className="bg-white border border-[#e0e0e0] rounded-lg p-6 flex flex-col items-center gap-4">
            <div className="w-20 h-20 rounded-full bg-[#57886c] flex items-center justify-center text-white text-3xl">
              {name.charAt(0)}
            </div>
            {editingName ? (
              <div className="flex items-center gap-2 w-full">
                <input
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  className="flex-1 border border-[#e0e0e0] rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-[#57886c]"
                  autoFocus
                />
                <button
                  onClick={() => { setName(nameInput); updateUser({ name: nameInput }); setEditingName(false); }}
                  className="text-[#57886c]"
                >
                  <Check className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <span className="text-base">{name}</span>
                <button onClick={() => setEditingName(true)} className="text-[#5a5a5a] hover:text-[#57886c]">
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
            <div className="text-sm text-[#5a5a5a]">{user?.email ?? ''}</div>
            <div className="text-xs text-[#5a5a5a] bg-[#f5f5f0] px-3 py-1 rounded-full">
              Member since Nov 2025
            </div>
            {/* Sign Out — lives here, not in Data & Privacy */}
            <button
              onClick={() => { logout(); navigate('/login'); }}
              className="flex items-center gap-2 w-full justify-center px-4 py-2 border border-[#e0e0e0] rounded-lg text-sm text-[#5a5a5a] hover:bg-[#f5f5f0] hover:text-[#c0392b] hover:border-[#c0392b]/30 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </button>
          </div>

          {/* Financial health score */}
          <div className="bg-white border border-[#e0e0e0] rounded-lg p-6">
            <h3 className="text-base mb-4 flex items-center gap-2">
              <Target className="w-4 h-4 text-[#57886c]" />
              Health Score History
            </h3>
            <div className="text-center mb-4">
              <div className="text-4xl text-[#fbbf24]">{avgScore}</div>
              <div className="text-xs text-[#5a5a5a]">6-month average</div>
            </div>
            <div className="flex flex-col gap-2">
              {healthHistory.map((h) => (
                <div key={h.month} className="flex items-center gap-3">
                  <div className="text-xs text-[#5a5a5a] w-20 shrink-0">{h.month}</div>
                  <div className="flex-1 h-1.5 bg-[#e0e0e0] rounded-full">
                    <div
                      className="h-1.5 rounded-full transition-all"
                      style={{ width: `${h.score}%`, backgroundColor: h.color }}
                    />
                  </div>
                  <div className="text-xs w-6 text-right shrink-0" style={{ color: h.color }}>{h.score}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right column */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          {/* AI Preferences */}
          <div className="bg-white border border-[#e0e0e0] rounded-lg p-6">
            <h3 className="text-base mb-1 flex items-center gap-2">
              <Palette className="w-4 h-4 text-[#57886c]" />
              AI & Personalization
            </h3>
            <p className="text-xs text-[#5a5a5a] mb-4">Your default advisor tone and display preferences</p>

            <div className="mb-5">
              <div className="text-sm mb-2">Default AI Tone</div>
              <div className="flex gap-2 flex-wrap">
                {(toneOptions as { id: Tone; emoji: string; label: string }[]).map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setPreferredTone(t.id)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm transition-colors ${preferredTone === t.id
                        ? 'bg-[#57886c]/15 border-[#57886c] text-[#57886c]'
                        : 'border-[#e0e0e0] text-[#5a5a5a] hover:border-[#57886c]'
                      }`}
                  >
                    <span>{t.emoji}</span>
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <div className="text-sm mb-2 flex items-center gap-2">
                  <Globe className="w-3.5 h-3.5 text-[#5a5a5a]" />
                  Currency
                </div>
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="w-full border border-[#e0e0e0] rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:border-[#57886c]"
                >
                  {currencies.map((c) => <option key={c}>{c}</option>)}
                </select>
              </div>

              <div>
                <div className="text-sm mb-2 flex items-center gap-2">
                  <Target className="w-3.5 h-3.5 text-[#5a5a5a]" />
                  Savings Target: <span className="text-[#57886c]">{savingsTarget}%</span>
                </div>
                <input
                  type="range"
                  min={5}
                  max={60}
                  step={5}
                  value={savingsTarget}
                  onChange={(e) => setSavingsTarget(Number(e.target.value))}
                  className="w-full accent-[#57886c]"
                />
                <div className="flex justify-between text-xs text-[#5a5a5a] mt-0.5">
                  <span>5%</span><span>60%</span>
                </div>
              </div>
            </div>
          </div>

          {/* Notifications */}
          <div className="bg-white border border-[#e0e0e0] rounded-lg p-6">
            <h3 className="text-base mb-1 flex items-center gap-2">
              <Bell className="w-4 h-4 text-[#57886c]" />
              Notifications
            </h3>
            <p className="text-xs text-[#5a5a5a] mb-4">Choose what piggy.ai keeps you updated on</p>
            <div className="flex flex-col gap-4">
              {[
                { key: 'weeklyReport' as const, label: 'Weekly Financial Report', desc: 'Summary every Sunday morning' },
                { key: 'spendingAlerts' as const, label: 'Overspending Alerts', desc: 'Notify when a category exceeds budget' },
                { key: 'goalMilestones' as const, label: 'Goal Milestones', desc: 'Celebrate when you hit savings targets' },
                { key: 'aiTips' as const, label: 'Daily AI Tips', desc: 'One financial tip from your advisor every day' },
              ].map((n) => (
                <div key={n.key} className="flex items-center justify-between">
                  <div>
                    <div className="text-sm">{n.label}</div>
                    <div className="text-xs text-[#5a5a5a]">{n.desc}</div>
                  </div>
                  <Toggle checked={notifications[n.key]} onChange={() => toggleNotif(n.key)} />
                </div>
              ))}
            </div>
          </div>

          {/* Upload history */}
          <div className="bg-white border border-[#e0e0e0] rounded-lg p-6">
            <h3 className="text-base mb-1 flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-[#57886c]" />
              Upload History
            </h3>
            <p className="text-xs text-[#5a5a5a] mb-4">All your past bank statement uploads</p>
            <div className="flex flex-col gap-2">
              {uploadHistory.map((u, i) => (
                <div key={i} className="flex items-center justify-between p-3 bg-[#f5f5f0] rounded-lg">
                  <div>
                    <div className="text-sm">{u.name}</div>
                    <div className="text-xs text-[#5a5a5a]">{u.date} · {u.size} · {u.transactions} transactions</div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-[#5a5a5a]" />
                </div>
              ))}
            </div>
          </div>

          {/* Data & Privacy — sign out removed from here */}
          <div className="bg-white border border-[#e0e0e0] rounded-lg p-6">
            <h3 className="text-base mb-1 flex items-center gap-2">
              <Shield className="w-4 h-4 text-[#57886c]" />
              Data & Privacy
            </h3>
            <p className="text-xs text-[#5a5a5a] mb-4">Your data stays on your device — we never store it on our servers</p>
            <div className="flex flex-col gap-2">
              <button className="flex items-center justify-between w-full p-3 bg-[#f5f5f0] rounded-lg hover:bg-[#e8e8e4] transition-colors">
                <div className="flex items-center gap-3">
                  <Download className="w-4 h-4 text-[#57886c]" />
                  <div className="text-left">
                    <div className="text-sm">Export All Data</div>
                    <div className="text-xs text-[#5a5a5a]">Download your transactions as CSV</div>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-[#5a5a5a]" />
              </button>
              <button className="flex items-center justify-between w-full p-3 bg-[#f5f5f0] rounded-lg hover:bg-[#e8e8e4] transition-colors">
                <div className="flex items-center gap-3">
                  <Trash2 className="w-4 h-4 text-[#c0392b]" />
                  <div className="text-left">
                    <div className="text-sm text-[#c0392b]">Clear All Data</div>
                    <div className="text-xs text-[#5a5a5a]">Remove all uploaded statements and analysis</div>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-[#5a5a5a]" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}