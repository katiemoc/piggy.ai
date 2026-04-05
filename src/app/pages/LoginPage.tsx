import { useState } from 'react';
import { useNavigate, Link } from 'react-router';
import { Eye, EyeOff, ArrowRight, Check } from 'lucide-react';
import { PigMascot } from '../components/PigMascot';
import { useAuth } from '../auth';

export function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!email || !password) {
      setError('Please fill in all fields.');
      return;
    }
    setLoading(true);
    try {
      await login(email, password);
      navigate('/upload');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex text-[#1a1a1a]">
      {/* ── Left branding panel (desktop only) ── */}
      <div className="hidden lg:flex lg:w-[44%] bg-gradient-to-br from-[#fce8eb] via-[#fdf0f3] to-[#fff8f5] flex-col items-center justify-center p-12 relative overflow-hidden shrink-0">
        {/* Decorative circles */}
        <div className="absolute -top-24 -left-24 w-72 h-72 rounded-full bg-[#b05878]/8 blur-3xl" />
        <div className="absolute -bottom-24 -right-24 w-72 h-72 rounded-full bg-[#57886c]/8 blur-3xl" />
        <div className="absolute top-1/3 right-0 w-32 h-32 rounded-full bg-[#fcc82d]/10 blur-2xl" />

        {/* Pig mascot */}
        <div className="relative mb-6 drop-shadow-sm">
          <PigMascot width={300} />
        </div>

        {/* Brand */}
        <div className="text-center mb-8">
          <h1 className="text-5xl tracking-tight mb-2">
            <span className="text-[#b05878]">piggy</span><span className="text-[#57886c]">.ai</span>
          </h1>
          <p className="text-[#5a5a5a] text-sm">your brutally honest financial twin</p>
        </div>

        {/* Feature list */}
        <div className="flex flex-col gap-3 w-full max-w-xs">
          {[
            'Analyze your spending patterns',
            'AI-powered financial insights',
            'Set goals & track your progress',
          ].map((text) => (
            <div key={text} className="flex items-center gap-3 text-sm text-[#3d3d36]">
              <div className="w-5 h-5 rounded-full bg-[#57886c]/15 flex items-center justify-center shrink-0">
                <Check className="w-3 h-3 text-[#57886c]" />
              </div>
              {text}
            </div>
          ))}
        </div>
      </div>

      {/* ── Right form panel ── */}
      <div className="flex-1 bg-[#f5f5f0] flex flex-col items-center justify-center p-6 overflow-y-auto">
        {/* Mobile logo — hidden on desktop */}
        <div className="lg:hidden flex flex-col items-center mb-8">
          <PigMascot width={110} />
          <h1 className="text-3xl tracking-tight mt-3">
            <span className="text-[#b05878]">piggy</span><span className="text-[#57886c]">.ai</span>
          </h1>
          <p className="text-[#5a5a5a] text-sm mt-1">your brutally honest financial twin</p>
        </div>

        <div className="w-full max-w-md">
          {/* Card */}
          <div className="bg-white border border-[#e0e0e0] rounded-2xl p-8 shadow-sm text-[#1a1a1a]">
            <div className="mb-6">
              <h2 className="text-xl tracking-tight">Welcome back</h2>
              <p className="text-sm text-[#5a5a5a] mt-1">Sign in to see your financial truth</p>
            </div>

            {/* Social buttons */}
            <div className="mb-6">
              <button
                onClick={() => {
                  const popup = window.open(
                    `${import.meta.env.VITE_API_URL}/api/auth/google`,
                    'google-auth',
                    'width=500,height=600,left=400,top=100'
                  );
                  const timer = setInterval(() => {
                    if (popup?.closed) {
                      clearInterval(timer);
                      const token = localStorage.getItem('piggy_token');
                      if (token) navigate('/upload');
                    }
                  }, 500);
                }}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 border border-[#e0e0e0] rounded-lg hover:bg-[#f5f5f0] transition-colors text-sm text-[#1a1a1a]"
              >
                <svg viewBox="0 0 24 24" className="w-4 h-4 shrink-0" aria-label="Google">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                </svg>
                Continue with Google
              </button>
            </div>

            <div className="relative mb-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-[#e0e0e0]" />
              </div>
              <div className="relative flex justify-center">
                <span className="bg-white px-3 text-xs text-[#5a5a5a]">or sign in with email</span>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              {error && (
                <div className="bg-[#c0392b]/10 border border-[#c0392b]/20 text-[#c0392b] text-sm px-4 py-3 rounded-lg">
                  {error}
                </div>
              )}

              <div>
                <label className="block text-sm text-[#1a1a1a] mb-1.5" htmlFor="email">Email</label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="alex@example.com"
                  className="w-full border border-[#e0e0e0] rounded-lg px-4 py-2.5 text-sm text-[#1a1a1a] focus:outline-none focus:border-[#57886c] transition-colors bg-white placeholder:text-[#b0b0b0]"
                />
              </div>

              <div>
                <div className="flex justify-between mb-1.5">
                  <label className="text-sm text-[#1a1a1a]" htmlFor="password">Password</label>
                  <button type="button" className="text-xs text-[#57886c] hover:text-[#466060] transition-colors">
                    Forgot password?
                  </button>
                </div>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full border border-[#e0e0e0] rounded-lg px-4 py-2.5 pr-10 text-sm text-[#1a1a1a] focus:outline-none focus:border-[#57886c] transition-colors bg-white placeholder:text-[#b0b0b0]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#5a5a5a] hover:text-[#1a1a1a] transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input
                  id="remember"
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 accent-[#57886c] rounded"
                />
                <label htmlFor="remember" className="text-sm text-[#5a5a5a] cursor-pointer">
                  Remember me for 30 days
                </label>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#57886c] text-white px-6 py-3 rounded-lg hover:bg-[#466060] transition-colors flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed mt-1"
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    Sign In
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          </div>

          <p className="text-center text-sm text-[#5a5a5a] mt-6">
            Don't have an account?{' '}
            <Link to="/signup" className="text-[#57886c] hover:text-[#466060] transition-colors">
              Create one free
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}