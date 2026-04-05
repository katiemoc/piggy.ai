import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router';
import { LayoutDashboard, Bot, Clock, User, Upload, MessageCircle, LogOut, Database } from 'lucide-react';
import { PigMascot } from './PigMascot';
import GatherStatements from './GatherStatements';
import { ChatBot } from './ChatBot';
import { useAuth } from '../auth';

function PigIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 4h1a1 1 0 0 1 0 2h-1" />
      <path d="M14 4a4 4 0 0 1 0 8H8a4 4 0 0 1 0-8" />
      <path d="M8 12v5" />
      <path d="M14 12v5" />
      <path d="M8 17a2 2 0 0 0 4 0" />
      <path d="M10 4V2" />
      <circle cx="9" cy="7" r="0.5" fill="currentColor" stroke="none" />
    </svg>
  );
}

const navLinks = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard', isPig: false },
  { to: '/ai',        icon: Bot,             label: 'AI Analysis', isPig: false },
  { to: '/history',   icon: Clock,           label: 'History',     isPig: false },
  { to: '/gamify',    icon: null,            label: 'Goals',       isPig: true  },
];

export function Layout() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [chatOpen, setChatOpen] = useState(false);
  const [showGather, setShowGather] = useState(false);

  return (
    <div className="w-full h-screen overflow-hidden flex bg-[#f5f5f0] text-[#1a1a1a]">
      {/* ── Sidebar — desktop ── */}
      <aside className="hidden md:flex flex-col w-56 bg-white border-r border-[#e0e0e0] shrink-0 h-screen sticky top-0">
        {/* Logo */}
        <div className="p-4 border-b border-[#e0e0e0]">
          <button
            onClick={() => navigate('/upload')}
            className="text-left w-full flex items-center gap-3"
          >
            <PigMascot width={40} />
            <div>
              <div className="text-xl tracking-tight leading-none">
                <span className="text-[#b05878]">piggy</span>
                <span className="text-[#57886c]">.ai</span>
              </div>
              <p className="text-xs text-[#5a5a5a] mt-0.5">brutally honest financial twin</p>
            </div>
          </button>
        </div>

        {/* Action buttons */}
        <div className="p-3 border-b border-[#e0e0e0] flex flex-col gap-2">
          <button
            onClick={() => setShowGather(true)}
            className="w-full flex items-center gap-2 px-3 py-2 bg-[#b05878] text-white rounded-lg hover:bg-[#8f3f60] transition-colors text-sm"
          >
            <Database className="w-4 h-4" />
            Gather Statements
          </button>

          <button
            onClick={() => navigate('/upload')}
            className="w-full flex items-center gap-2 px-3 py-2 bg-[#57886c] text-white rounded-lg hover:bg-[#466060] transition-colors text-sm"
          >
            <Upload className="w-4 h-4" />
            New Upload
          </button>
        </div>

        {/* Nav links */}
        <nav className="flex-1 p-3 flex flex-col gap-0.5 overflow-y-auto">
          {navLinks.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-sm ${
                  isActive
                    ? 'bg-[#57886c]/15 text-[#57886c]'
                    : 'text-[#5a5a5a] hover:bg-[#f5f5f0] hover:text-[#1a1a1a]'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  {item.isPig
                    ? <PigIcon className={`w-4 h-4 ${isActive ? 'text-[#57886c]' : ''}`} />
                    : item.icon && <item.icon className="w-4 h-4" />
                  }
                  {item.label}
                </>
              )}
            </NavLink>
          ))}

          {/* Chat toggle */}
          <button
            onClick={() => setChatOpen((o) => !o)}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-sm mt-0.5 ${
              chatOpen
                ? 'bg-[#b05878]/15 text-[#b05878]'
                : 'text-[#5a5a5a] hover:bg-[#f5f5f0] hover:text-[#1a1a1a]'
            }`}
          >
            <MessageCircle className="w-4 h-4" />
            Piggy Chat
            {chatOpen && (
              <span className="ml-auto w-1.5 h-1.5 rounded-full bg-[#b05878]" />
            )}
          </button>
        </nav>

        {/* Profile link */}
        <div className="p-3 border-t border-[#e0e0e0]">
          <NavLink
            to="/profile"
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                isActive
                  ? 'bg-[#57886c]/15 text-[#57886c]'
                  : 'text-[#5a5a5a] hover:bg-[#f5f5f0] hover:text-[#1a1a1a]'
              }`
            }
          >
            <div className="w-7 h-7 rounded-full bg-[#57886c] flex items-center justify-center text-white text-xs shrink-0">
              {user?.name?.[0]?.toUpperCase() ?? 'U'}
            </div>
            <div className="min-w-0">
              <div className="text-[#1a1a1a] text-sm truncate">{user?.name ?? 'Profile'}</div>
              <div className="text-xs text-[#5a5a5a]">View Profile</div>
            </div>
          </NavLink>

          <button
            onClick={() => { logout(); navigate('/login'); }}
            className="flex items-center gap-3 w-full px-3 py-2 mt-0.5 rounded-lg text-sm text-[#5a5a5a] hover:bg-[#f5f5f0] hover:text-[#c0392b] transition-colors"
          >
            <LogOut className="w-4 h-4 shrink-0" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* ── Main content ── */}
      <main className="flex-1 overflow-auto min-w-0 pb-16 md:pb-0">
        <Outlet />
      </main>

      {/* ── Chat panel ── */}
      <div
        className={`
          flex flex-col border-l border-[#e0e0e0] bg-white
          transition-all duration-300 shrink-0 h-screen sticky top-0
          ${chatOpen ? 'w-full md:w-80' : 'w-0 overflow-hidden'}
          ${chatOpen ? 'fixed inset-0 z-40 md:relative md:inset-auto md:z-auto' : ''}
        `}
      >
        <ChatBot onClose={() => setChatOpen(false)} />
      </div>

      {/* ── Bottom nav — mobile ── */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-[#e0e0e0] flex z-50">
        {navLinks.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex-1 flex flex-col items-center gap-1 py-2 text-xs transition-colors ${
                isActive ? 'text-[#57886c]' : 'text-[#5a5a5a]'
              }`
            }
          >
            {({ isActive }) => (
              <>
                {item.isPig
                  ? <PigIcon className={`w-5 h-5 ${isActive ? 'text-[#57886c]' : ''}`} />
                  : item.icon && <item.icon className="w-5 h-5" />
                }
                <span>{item.label}</span>
              </>
            )}
          </NavLink>
        ))}

        <button
          onClick={() => setChatOpen((o) => !o)}
          className={`flex-1 flex flex-col items-center gap-1 py-2 text-xs transition-colors ${
            chatOpen ? 'text-[#b05878]' : 'text-[#5a5a5a]'
          }`}
        >
          <MessageCircle className="w-5 h-5" />
          <span>Chat</span>
        </button>

        <NavLink
          to="/profile"
          className={({ isActive }) =>
            `flex-1 flex flex-col items-center gap-1 py-2 text-xs transition-colors ${
              isActive ? 'text-[#57886c]' : 'text-[#5a5a5a]'
            }`
          }
        >
          <User className="w-5 h-5" />
          <span>Profile</span>
        </NavLink>
      </nav>

      {/* Modal */}
      {showGather && (
        <div
          className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4"
          onClick={(e) => { if (e.target === e.currentTarget) setShowGather(false); }}
        >
          <GatherStatements onClose={() => setShowGather(false)} />
        </div>
      )}
    </div>
  );
}