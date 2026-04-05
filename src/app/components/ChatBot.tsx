import { useState, useRef, useEffect } from 'react';
import { Send, X, Clock, ArrowLeft, Plus, MessageCircle } from 'lucide-react';
import { useTone, Tone } from '../context/ToneContext';

/* ─── Types ──────────────────────────────────────────────────────────── */
interface Message {
  id: number;
  role: 'bot' | 'user';
  text: string;
  ts: Date;
}

interface ChatSession {
  id: number;
  startedAt: Date;
  tone: Tone;
  messages: Message[];
}

type View = 'chat' | 'history' | 'session';

/* ─── Tone config ────────────────────────────────────────────────────── */
const toneConfig: Record<Tone, {
  name: string;
  emoji: string;
  greeting: string;
  responses: Array<{ keywords: string[]; reply: string }>;
  fallback: string;
}> = {
  immigrant: {
    name: 'Immigrant Parent',
    emoji: '😤',
    greeting:
      'Okay, fine. You come to me. Good. What is the financial question? And please, do not tell me you spent money on bubble tea again.',
    responses: [
      {
        keywords: ['spend', 'spending', 'expense', 'spent'],
        reply:
          'Spending? Every dollar you waste is a dollar not working for you. When I came to this country I had nothing. Nothing! And still I saved. What is your excuse?',
      },
      {
        keywords: ['save', 'saving', 'savings'],
        reply:
          'Finally, a smart question! You should save minimum 30 to 40 percent. Anything less is embarrassing. Open a high-yield savings account. Ally Bank, Marcus — go look. Do it now, not tomorrow.',
      },
      {
        keywords: ['invest', 'stock', 'market', 'index', 'etf', '401k', 'roth'],
        reply:
          'Index funds. Low cost. S&P 500. You put money in every month and do NOT touch it. Do not try to be clever and pick individual stocks. You will lose. I have seen it happen.',
      },
      {
        keywords: ['food', 'restaurant', 'eat', 'dining', 'coffee', 'lunch'],
        reply:
          'You are paying HOW MUCH for food? Cook at home! Rice, beans, vegetables — healthy and cheap. Five dollars for coffee every day is one thousand, eight hundred dollars a year. Wasted!',
      },
      {
        keywords: ['budget', 'plan', 'goal'],
        reply:
          'Budget is simple. Write down income. Write down every expense. Whatever is left — half goes to savings, half to investments. Do not budget with your feelings. Budget with math.',
      },
      {
        keywords: ['debt', 'loan', 'credit card', 'owe'],
        reply:
          'Debt is a prison. You pay the debt FIRST before anything else. Minimum payment is not enough — pay as much as possible. High interest debt is an emergency. Treat it like one.',
      },
      {
        keywords: ['rent', 'house', 'mortgage', 'home'],
        reply:
          'Housing should be no more than 30 percent of take-home pay. If it is more, you need to make more money or find a roommate. Pride is expensive — be practical.',
      },
      {
        keywords: ['score', 'credit score', 'fico'],
        reply:
          'Credit score! Pay your full balance every month. Never miss a payment. Keep usage below 30 percent. This is not complicated. Discipline. That is all.',
      },
    ],
    fallback:
      'Hmm. This is not easy to answer. But let me tell you — the answer is always the same: spend less, save more, invest the difference. Do not overcomplicate it. My generation built wealth with simple discipline.',
  },

  financebro: {
    name: 'Finance Bro',
    emoji: '📈',
    greeting:
      "Yo chief! Ready to talk alpha and get your financial game to the next level? 🚀 What's on your mind — let's optimize.",
    responses: [
      {
        keywords: ['spend', 'spending', 'expense', 'spent'],
        reply:
          'Spending is just capital allocation, chief. Every dollar has an opportunity cost. Ask yourself: is this purchase returning more value than a 10% annual compounding investment? Most of the time — no.',
      },
      {
        keywords: ['save', 'saving', 'savings'],
        reply:
          "Savings rate is your most powerful lever early on. Even more than investment returns. Get to 30-40% and you're building serious wealth. Park it in a HYSA at 4-5% while you deploy it.",
      },
      {
        keywords: ['invest', 'stock', 'market', 'index', 'etf', '401k', 'roth'],
        reply:
          "Classic playbook: max 401k to $23,500, then Roth IRA to $7,000, then taxable brokerage. VOO or VTI for broad exposure. Low-cost, high-diversification. Let compounding do the heavy lifting — don't touch it.",
      },
      {
        keywords: ['food', 'restaurant', 'eat', 'dining', 'coffee', 'lunch'],
        reply:
          'Food spend is a silent portfolio killer. Meal prep Sunday through Friday, eat out strategically on weekends. That $800/month in dining = $9,600/year = ~$96,000 in 10 years at 10% APY. The math is brutal.',
      },
      {
        keywords: ['budget', 'plan', 'goal'],
        reply:
          "50/30/20 is the entry-level framework, but I'd push for 50/20/30 — 30% investing, 20% lifestyle. Automate everything: income hits, bills auto-pay, investment auto-transfers. Remove human emotion from the equation.",
      },
      {
        keywords: ['debt', 'loan', 'credit card', 'owe'],
        reply:
          'Debt above 7% is guaranteed negative return. Avalanche method — attack highest interest first. Below 4%? Math says invest instead. This is pure expected value calculation, not feelings.',
      },
      {
        keywords: ['rent', 'house', 'mortgage', 'home'],
        reply:
          "House hacking is an underrated play — rent out a room, offset your mortgage. If you can't house hack, keep housing under 28% gross income. Real estate can be fine but don't over-concentrate in an illiquid single asset.",
      },
      {
        keywords: ['score', 'credit score', 'fico'],
        reply:
          "Credit score is your leverage score. Sub-10% utilization, zero missed payments, don't close old accounts. Above 800 and you're getting the best mortgage rates — that saves six figures over a 30-year loan.",
      },
    ],
    fallback:
      "Good question, chief. Look — fundamentals always win: high savings rate, diversified index fund portfolio, minimize tax drag. Everything else is noise. Stay systematic, stay the course, let time and compounding do the work.",
  },

  bestie: {
    name: 'Supportive Bestie',
    emoji: '💕',
    greeting:
      "Heyyyy bestie!! 💕 I'm so glad you're here — let's talk money, no judgment whatsoever. I've got you! What's on your mind?",
    responses: [
      {
        keywords: ['spend', 'spending', 'expense', 'spent'],
        reply:
          "Okay so first — no shame! We ALL have those spending moments 💕 Let's figure out if it's a pattern or just a one-off. What were you spending on? Sometimes it helps to just name it without judgment first.",
      },
      {
        keywords: ['save', 'saving', 'savings'],
        reply:
          'Saving is genuinely such a form of self-love, no cap. Even starting with $50/month is a win! The trick is automating it so you never even see the money. Out of sight, out of mind, into your future ✨',
      },
      {
        keywords: ['invest', 'stock', 'market', 'index', 'etf', '401k', 'roth'],
        reply:
          "Investing sounds scary but honestly it's not that deep! Start with your 401k if your job offers it — especially if there's a match (that's FREE money, bestie). Then a Roth IRA. Index funds like VOO are so beginner friendly 🌱",
      },
      {
        keywords: ['food', 'restaurant', 'eat', 'dining', 'coffee', 'lunch'],
        reply:
          "Okay real talk — food is one of my biggest expenses too and I get it! But maybe we try meal prepping two nights a week? Or set a \"dining out budget\" and stick to it? It doesn't have to be all or nothing 🍜",
      },
      {
        keywords: ['budget', 'plan', 'goal'],
        reply:
          "Budgeting doesn't have to feel restrictive! Think of it as a plan for your money to do things YOU want. Try the \"pay yourself first\" method — savings come out first, then you enjoy the rest guilt-free 💸",
      },
      {
        keywords: ['debt', 'loan', 'credit card', 'owe'],
        reply:
          "Debt is stressful and I hear you 😤 But you're already ahead by talking about it! Write down every debt, smallest to largest. Knock out the small ones first for those wins — momentum is everything, bestie.",
      },
      {
        keywords: ['rent', 'house', 'mortgage', 'home'],
        reply:
          "Housing is SO expensive right now and it's genuinely not your fault 💕 The general rule is under 30% of take-home, but if you're in a high cost of living city, be gentle with yourself. Are there ways to reduce like a roommate or negotiating?",
      },
      {
        keywords: ['score', 'credit score', 'fico'],
        reply:
          "Think of your credit score as your financial reputation — it takes time to build but you can absolutely improve it! Pay on time (set autopay!), keep balances low, and don't open too many new cards. You've got this ✨",
      },
    ],
    fallback:
      "Okay I love that you're asking questions because that's literally the most important step 💕 I'd say: be honest with yourself about your spending, make saving automatic, and remember — progress over perfection always. You're doing amazing!",
  },
};

/* ─── Helpers ────────────────────────────────────────────────────────── */
function getBotReply(input: string, tone: Tone): string {
  const lower = input.toLowerCase();
  const config = toneConfig[tone];
  const match = config.responses.find((r) =>
    r.keywords.some((kw) => lower.includes(kw))
  );
  if (match && Math.random() > 0.15) return match.reply;
  return config.fallback;
}

function formatDate(d: Date): string {
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days === 1) return 'Yesterday';
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function formatTime(d: Date): string {
  return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}

function sessionPreview(session: ChatSession): string {
  const userMsg = session.messages.find((m) => m.role === 'user');
  if (userMsg) return userMsg.text.length > 52 ? userMsg.text.slice(0, 52) + '…' : userMsg.text;
  return 'No messages yet';
}

let _id = 0;
const uid = () => ++_id;

function makeGreeting(tone: Tone): Message {
  return { id: uid(), role: 'bot', text: toneConfig[tone].greeting, ts: new Date() };
}

/* ─── Seed history for demo purposes ────────────────────────────────── */
const seedSessions: ChatSession[] = [
  {
    id: uid(),
    startedAt: new Date(Date.now() - 2 * 86400000),
    tone: 'immigrant',
    messages: [
      { id: uid(), role: 'bot', text: toneConfig.immigrant.greeting, ts: new Date(Date.now() - 2 * 86400000 + 1000) },
      { id: uid(), role: 'user', text: 'How do I start saving more money?', ts: new Date(Date.now() - 2 * 86400000 + 60000) },
      { id: uid(), role: 'bot', text: toneConfig.immigrant.responses[1].reply, ts: new Date(Date.now() - 2 * 86400000 + 65000) },
      { id: uid(), role: 'user', text: 'What about investing?', ts: new Date(Date.now() - 2 * 86400000 + 120000) },
      { id: uid(), role: 'bot', text: toneConfig.immigrant.responses[2].reply, ts: new Date(Date.now() - 2 * 86400000 + 126000) },
    ],
  },
  {
    id: uid(),
    startedAt: new Date(Date.now() - 5 * 86400000),
    tone: 'bestie',
    messages: [
      { id: uid(), role: 'bot', text: toneConfig.bestie.greeting, ts: new Date(Date.now() - 5 * 86400000 + 1000) },
      { id: uid(), role: 'user', text: 'I have a lot of credit card debt, help!', ts: new Date(Date.now() - 5 * 86400000 + 45000) },
      { id: uid(), role: 'bot', text: toneConfig.bestie.responses[5].reply, ts: new Date(Date.now() - 5 * 86400000 + 51000) },
    ],
  },
];

/* ─── Component ──────────────────────────────────────────────────────── */
interface ChatBotProps {
  onClose: () => void;
}

export function ChatBot({ onClose }: ChatBotProps) {
  const { tone } = useTone();
  const config = toneConfig[tone];

  const [view, setView] = useState<View>('chat');
  const [selectedSession, setSelectedSession] = useState<ChatSession | null>(null);
  const [sessions, setSessions] = useState<ChatSession[]>(seedSessions);
  const [messages, setMessages] = useState<Message[]>([makeGreeting(tone)]);
  const [input, setInput] = useState('');
  const [thinking, setThinking] = useState(false);

  const bottomRef = useRef<HTMLDivElement>(null);
  const prevToneRef = useRef<Tone>(tone);

  // When tone changes, append persona-switch notice to current chat
  useEffect(() => {
    if (prevToneRef.current !== tone) {
      prevToneRef.current = tone;
      const newConfig = toneConfig[tone];
      setMessages((prev) => [
        ...prev,
        {
          id: uid(),
          role: 'bot',
          text: `[Switched to ${newConfig.emoji} ${newConfig.name}]\n\n${newConfig.greeting}`,
          ts: new Date(),
        },
      ]);
    }
  }, [tone]);

  // Scroll to bottom
  useEffect(() => {
    if (view === 'chat' || view === 'session') {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, thinking, view, selectedSession]);

  /* ── Actions ── */
  const send = () => {
    const text = input.trim();
    if (!text || thinking) return;
    setInput('');
    const userMsg: Message = { id: uid(), role: 'user', text, ts: new Date() };
    setMessages((prev) => [...prev, userMsg]);
    setThinking(true);
    setTimeout(() => {
      const reply = getBotReply(text, tone);
      setMessages((prev) => [...prev, { id: uid(), role: 'bot', text: reply, ts: new Date() }]);
      setThinking(false);
    }, 900 + Math.random() * 600);
  };

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); }
  };

  const startNewChat = () => {
    // Save current session if it has user messages
    const hasUserMessages = messages.some((m) => m.role === 'user');
    if (hasUserMessages) {
      const session: ChatSession = { id: uid(), startedAt: messages[0].ts, tone, messages };
      setSessions((prev) => [session, ...prev]);
    }
    setMessages([makeGreeting(tone)]);
    setView('chat');
  };

  const openSession = (s: ChatSession) => {
    setSelectedSession(s);
    setView('session');
  };

  const userMsgCount = (s: ChatSession) => s.messages.filter((m) => m.role === 'user').length;

  /* ── Render helpers ── */
  const renderMessages = (msgs: Message[], readOnly = false) => (
    <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-3">
      {msgs.map((msg) => (
        <div key={msg.id} className={`flex gap-2.5 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
          {msg.role === 'bot' && (
            <div className="w-7 h-7 rounded-full bg-[#b05878]/15 flex items-center justify-center text-sm shrink-0 mt-0.5">
              {toneConfig[readOnly && selectedSession ? selectedSession.tone : tone].emoji}
            </div>
          )}
          <div className="flex flex-col gap-0.5" style={{ maxWidth: '82%', alignItems: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
            <div
              className={`rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed whitespace-pre-wrap ${
                msg.role === 'user'
                  ? 'bg-[#57886c] text-white rounded-br-sm'
                  : 'bg-[#f5f5f0] text-[#1a1a1a] rounded-bl-sm'
              }`}
            >
              {msg.text}
            </div>
            <span className="text-[10px] text-[#b0b0b0] px-1">{formatTime(msg.ts)}</span>
          </div>
        </div>
      ))}
      {!readOnly && thinking && (
        <div className="flex gap-2.5">
          <div className="w-7 h-7 rounded-full bg-[#b05878]/15 flex items-center justify-center text-sm shrink-0">
            {config.emoji}
          </div>
          <div className="bg-[#f5f5f0] rounded-2xl rounded-bl-sm px-4 py-3 flex gap-1 items-center">
            {[0, 1, 2].map((i) => (
              <div key={i} className="w-1.5 h-1.5 rounded-full bg-[#5a5a5a] animate-bounce" style={{ animationDelay: `${i * 150}ms` }} />
            ))}
          </div>
        </div>
      )}
      <div ref={bottomRef} />
    </div>
  );

  /* ══════════════════════════════════════════════════════════════════ */
  return (
    <div className="flex flex-col h-full bg-white">

      {/* ── HISTORY LIST view ── */}
      {view === 'history' && (
        <>
          <div className="flex items-center justify-between px-4 py-3 border-b border-[#e0e0e0] shrink-0">
            <div className="flex items-center gap-2">
              <button onClick={() => setView('chat')} className="text-[#5a5a5a] hover:text-[#1a1a1a] p-1 rounded-lg hover:bg-[#f5f5f0] transition-colors">
                <ArrowLeft className="w-4 h-4" />
              </button>
              <div>
                <div className="text-sm text-[#1a1a1a]">Chat History</div>
                <div className="text-xs text-[#5a5a5a]">{sessions.length} conversation{sessions.length !== 1 ? 's' : ''}</div>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={startNewChat}
                className="flex items-center gap-1 text-xs text-[#57886c] hover:text-[#466060] px-2 py-1.5 rounded-lg hover:bg-[#f5f5f0] transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                New
              </button>
              <button onClick={onClose} className="text-[#5a5a5a] hover:text-[#1a1a1a] p-1 rounded-lg hover:bg-[#f5f5f0] transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {sessions.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full gap-3 px-6 text-center">
                <div className="w-12 h-12 rounded-full bg-[#f5f5f0] flex items-center justify-center text-2xl">💬</div>
                <p className="text-sm text-[#5a5a5a]">No past conversations yet.</p>
                <p className="text-xs text-[#b0b0b0]">Start chatting and your history will appear here.</p>
              </div>
            ) : (
              <div className="flex flex-col divide-y divide-[#f0f0f0]">
                {sessions.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => openSession(s)}
                    className="flex items-start gap-3 px-4 py-3.5 hover:bg-[#f9f9f7] transition-colors text-left w-full"
                  >
                    <div className="w-8 h-8 rounded-full bg-[#b05878]/12 flex items-center justify-center text-base shrink-0 mt-0.5">
                      {toneConfig[s.tone].emoji}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-0.5">
                        <span className="text-xs text-[#5a5a5a]">{toneConfig[s.tone].name}</span>
                        <span className="text-[10px] text-[#b0b0b0] shrink-0">{formatDate(s.startedAt)}</span>
                      </div>
                      <p className="text-sm text-[#1a1a1a] truncate">{sessionPreview(s)}</p>
                      <p className="text-xs text-[#b0b0b0] mt-0.5">{userMsgCount(s)} message{userMsgCount(s) !== 1 ? 's' : ''}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {/* ── SESSION DETAIL view ── */}
      {view === 'session' && selectedSession && (
        <>
          <div className="flex items-center justify-between px-4 py-3 border-b border-[#e0e0e0] shrink-0">
            <div className="flex items-center gap-2">
              <button onClick={() => setView('history')} className="text-[#5a5a5a] hover:text-[#1a1a1a] p-1 rounded-lg hover:bg-[#f5f5f0] transition-colors">
                <ArrowLeft className="w-4 h-4" />
              </button>
              <div>
                <div className="text-sm text-[#1a1a1a] flex items-center gap-1.5">
                  {toneConfig[selectedSession.tone].emoji}
                  {toneConfig[selectedSession.tone].name}
                </div>
                <div className="text-xs text-[#5a5a5a]">{selectedSession.startedAt.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</div>
              </div>
            </div>
            <button onClick={onClose} className="text-[#5a5a5a] hover:text-[#1a1a1a] p-1 rounded-lg hover:bg-[#f5f5f0] transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>

          {renderMessages(selectedSession.messages, true)}

          {/* Read-only footer */}
          <div className="px-4 py-3 border-t border-[#e0e0e0] shrink-0 flex items-center justify-between">
            <p className="text-xs text-[#b0b0b0]">Read-only — past conversation</p>
            <button
              onClick={() => setView('chat')}
              className="flex items-center gap-1.5 text-xs text-[#57886c] hover:text-[#466060] transition-colors px-2.5 py-1.5 rounded-lg hover:bg-[#f5f5f0]"
            >
              <MessageCircle className="w-3.5 h-3.5" />
              Back to chat
            </button>
          </div>
        </>
      )}

      {/* ── ACTIVE CHAT view ── */}
      {view === 'chat' && (
        <>
          <div className="flex items-center justify-between px-4 py-3 border-b border-[#e0e0e0] bg-white shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-[#b05878]/15 flex items-center justify-center text-base">
                {config.emoji}
              </div>
              <div>
                <div className="text-sm text-[#1a1a1a]">piggy chat</div>
                <div className="text-xs text-[#5a5a5a]">{config.name} mode</div>
              </div>
            </div>
            <div className="flex items-center gap-1">
              {/* New chat */}
              <button
                onClick={startNewChat}
                title="New chat"
                className="text-[#5a5a5a] hover:text-[#57886c] p-1.5 rounded-lg hover:bg-[#f5f5f0] transition-colors"
              >
                <Plus className="w-4 h-4" />
              </button>
              {/* History */}
              <button
                onClick={() => setView('history')}
                title="Chat history"
                className="text-[#5a5a5a] hover:text-[#57886c] p-1.5 rounded-lg hover:bg-[#f5f5f0] transition-colors relative"
              >
                <Clock className="w-4 h-4" />
                {sessions.length > 0 && (
                  <span className="absolute top-0.5 right-0.5 w-1.5 h-1.5 rounded-full bg-[#b05878]" />
                )}
              </button>
              {/* Close */}
              <button onClick={onClose} className="text-[#5a5a5a] hover:text-[#1a1a1a] p-1.5 rounded-lg hover:bg-[#f5f5f0] transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {renderMessages(messages)}

          {/* Suggested prompts */}
          {messages.length <= 2 && (
            <div className="px-4 pb-2 flex flex-col gap-1.5 shrink-0">
              <p className="text-xs text-[#5a5a5a] mb-0.5">Try asking:</p>
              {['How should I cut my spending?', 'How do I start investing?', 'What should my savings rate be?'].map((prompt) => (
                <button
                  key={prompt}
                  onClick={() => setInput(prompt)}
                  className="text-left text-xs px-3 py-2 bg-[#f5f5f0] rounded-lg text-[#5a5a5a] hover:bg-[#e8e8e4] hover:text-[#1a1a1a] transition-colors"
                >
                  {prompt}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <div className="px-4 py-3 border-t border-[#e0e0e0] shrink-0">
            <div className="flex gap-2 items-end">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKey}
                placeholder="Ask piggy anything…"
                rows={1}
                className="flex-1 resize-none border border-[#e0e0e0] rounded-xl px-3.5 py-2.5 text-sm text-[#1a1a1a] placeholder:text-[#b0b0b0] focus:outline-none focus:border-[#57886c] bg-white leading-relaxed"
                style={{ maxHeight: 96 }}
                onInput={(e) => {
                  const el = e.currentTarget;
                  el.style.height = 'auto';
                  el.style.height = Math.min(el.scrollHeight, 96) + 'px';
                }}
              />
              <button
                onClick={send}
                disabled={!input.trim() || thinking}
                className="w-9 h-9 rounded-xl bg-[#57886c] flex items-center justify-center text-white hover:bg-[#466060] transition-colors disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
            <p className="text-[10px] text-[#b0b0b0] mt-1.5 text-center">
              Change tone in{' '}
              <a href="/profile" className="text-[#57886c] hover:underline">Profile settings</a>
            </p>
          </div>
        </>
      )}
    </div>
  );
}
