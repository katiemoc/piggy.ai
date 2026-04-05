import { useState } from 'react';
import { useNavigate, Link } from 'react-router';
import { useAuth } from '../auth';
import { Eye, EyeOff, ArrowRight, Check } from 'lucide-react';

function PasswordStrengthBar({ password }: { password: string }) {
  const checks = [
    { label: 'At least 8 characters', pass: password.length >= 8 },
    { label: 'Uppercase letter', pass: /[A-Z]/.test(password) },
    { label: 'Number', pass: /[0-9]/.test(password) },
    { label: 'Special character', pass: /[^A-Za-z0-9]/.test(password) },
  ];
  const score = checks.filter((c) => c.pass).length;
  const color = score <= 1 ? '#c0392b' : score === 2 ? '#e8924a' : score === 3 ? '#fbbf24' : '#57886c';
  const label = score <= 1 ? 'Weak' : score === 2 ? 'Fair' : score === 3 ? 'Good' : 'Strong';

  if (!password) return null;

  return (
    <div className="mt-2">
      <div className="flex gap-1 mb-1.5">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className="flex-1 h-1 rounded-full transition-colors"
            style={{ backgroundColor: i < score ? color : '#e0e0e0' }}
          />
        ))}
      </div>
      <div className="flex items-center justify-between">
        <div className="flex flex-wrap gap-x-3 gap-y-1">
          {checks.map((c) => (
            <span
              key={c.label}
              className={`text-xs flex items-center gap-1 transition-colors ${c.pass ? 'text-[#57886c]' : 'text-[#b0b0b0]'}`}
            >
              <Check className="w-3 h-3" />
              {c.label}
            </span>
          ))}
        </div>
        <span className="text-xs shrink-0 ml-2" style={{ color }}>{label}</span>
      </div>
    </div>
  );
}

export function SignupPage() {
  const navigate = useNavigate();
  const { signup } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!name || !email || !password || !confirmPassword) {
      setError('Please fill in all fields.');
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords don't match.");
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    if (!agreed) {
      setError('Please agree to the terms to continue.');
      return;
    }
    setLoading(true);
    try {
      await signup(name, email, password);
      navigate('/upload');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const passwordsMatch = confirmPassword.length > 0 && password === confirmPassword;
  const passwordsMismatch = confirmPassword.length > 0 && password !== confirmPassword;

  return (
    <div className="min-h-screen bg-[#f5f5f0] flex flex-col items-center justify-center p-4">
      {/* Background blobs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full bg-[#57886c]/8 blur-3xl" />
        <div className="absolute -bottom-32 -left-32 w-96 h-96 rounded-full bg-[#81a684]/10 blur-3xl" />
      </div>

      <div className="w-full max-w-md relative">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-block">
            <h1 className="text-4xl tracking-tight">
              <span className="text-[#b05878]">piggy</span><span className="text-[#57886c]">.ai</span>
            </h1>
          </Link>
          <p className="text-[#5a5a5a] text-sm mt-1">your brutally honest financial twin</p>
        </div>

        {/* Card */}
        <div className="bg-white border border-[#e0e0e0] rounded-2xl p-8 shadow-sm text-[#1a1a1a]">
          <div className="mb-6">
            <h2 className="text-xl tracking-tight">Create your account</h2>
            <p className="text-sm text-[#5a5a5a] mt-1">Free forever. No credit card required.</p>
          </div>

          {/* Social buttons */}
          <div className="flex gap-3 mb-6">
            <button
              onClick={() => navigate('/upload')}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 border border-[#e0e0e0] rounded-lg hover:bg-[#f5f5f0] transition-colors text-sm"
            >
              <svg viewBox="0 0 24 24" className="w-4 h-4 shrink-0" aria-label="Google">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
              </svg>
              Sign up with Google
            </button>
            <button
              onClick={() => navigate('/upload')}
              className="flex items-center justify-center gap-2 px-4 py-2.5 border border-[#e0e0e0] rounded-lg hover:bg-[#f5f5f0] transition-colors text-sm"
            >
              <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor" aria-label="Apple">
                <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
              </svg>
            </button>
          </div>

          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[#e0e0e0]" />
            </div>
            <div className="relative flex justify-center">
              <span className="bg-white px-3 text-xs text-[#5a5a5a]">or sign up with email</span>
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
              <label className="block text-sm mb-1.5" htmlFor="name">Full Name</label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Alex Chen"
                className="w-full border border-[#e0e0e0] rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-[#57886c] transition-colors bg-white placeholder:text-[#b0b0b0]"
              />
            </div>

            <div>
              <label className="block text-sm mb-1.5" htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="alex@example.com"
                className="w-full border border-[#e0e0e0] rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-[#57886c] transition-colors bg-white placeholder:text-[#b0b0b0]"
              />
            </div>

            <div>
              <label className="block text-sm mb-1.5" htmlFor="password">Password</label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Create a strong password"
                  className="w-full border border-[#e0e0e0] rounded-lg px-4 py-2.5 pr-10 text-sm focus:outline-none focus:border-[#57886c] transition-colors bg-white placeholder:text-[#b0b0b0]"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#5a5a5a] hover:text-[#1a1a1a] transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <PasswordStrengthBar password={password} />
            </div>

            <div>
              <label className="block text-sm mb-1.5" htmlFor="confirm">Confirm Password</label>
              <div className="relative">
                <input
                  id="confirm"
                  type={showConfirm ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repeat your password"
                  className={`w-full border rounded-lg px-4 py-2.5 pr-10 text-sm focus:outline-none transition-colors bg-white placeholder:text-[#b0b0b0] ${
                    passwordsMismatch
                      ? 'border-[#c0392b] focus:border-[#c0392b]'
                      : passwordsMatch
                      ? 'border-[#57886c] focus:border-[#57886c]'
                      : 'border-[#e0e0e0] focus:border-[#57886c]'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#5a5a5a] hover:text-[#1a1a1a] transition-colors"
                >
                  {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {passwordsMismatch && (
                <p className="text-xs text-[#c0392b] mt-1">Passwords don't match</p>
              )}
              {passwordsMatch && (
                <p className="text-xs text-[#57886c] mt-1 flex items-center gap-1">
                  <Check className="w-3 h-3" /> Passwords match
                </p>
              )}
            </div>

            <div className="flex items-start gap-2">
              <input
                id="terms"
                type="checkbox"
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
                className="w-4 h-4 accent-[#57886c] mt-0.5 rounded shrink-0"
              />
              <label htmlFor="terms" className="text-sm text-[#5a5a5a] cursor-pointer leading-relaxed">
                I agree to the{' '}
                <span className="text-[#57886c] hover:text-[#466060] cursor-pointer transition-colors">
                  Terms of Service
                </span>{' '}
                and{' '}
                <span className="text-[#57886c] hover:text-[#466060] cursor-pointer transition-colors">
                  Privacy Policy
                </span>
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
                  Create Account
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Trust signals */}
          <div className="mt-6 pt-5 border-t border-[#e0e0e0] flex items-center justify-center gap-6">
            {['🔒 Private by default', '📁 Your data stays local', '✨ Free forever'].map((t) => (
              <span key={t} className="text-xs text-[#5a5a5a]">{t}</span>
            ))}
          </div>
        </div>

        <p className="text-center text-sm text-[#5a5a5a] mt-6">
          Already have an account?{' '}
          <Link to="/login" className="text-[#57886c] hover:text-[#466060] transition-colors">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}