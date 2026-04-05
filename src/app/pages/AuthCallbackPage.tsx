import { useEffect } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '../auth';

export function AuthCallbackPage() {
  const navigate = useNavigate();
  const { loginWithToken } = useAuth();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    const user = params.get('user');

    if (token && user) {
      const parsedUser = JSON.parse(user);
      if (window.opener) {
        // Pass token + user so parent window can update its own React state
        window.opener.postMessage({ type: 'google-auth-success', token, user: parsedUser }, '*');
        window.close();
      } else {
        // Redirect flow (no popup) — set auth state directly
        loginWithToken(token, parsedUser);
        navigate('/upload');
      }
    } else {
      if (window.opener) {
        window.opener.postMessage({ type: 'google-auth-failed' }, '*');
        window.close();
      } else {
        navigate('/login');
      }
    }
  }, []);

  return (
    <div className="min-h-screen bg-[#f5f5f0] flex items-center justify-center">
      <div className="w-6 h-6 border-2 border-[#57886c]/30 border-t-[#57886c] rounded-full animate-spin" />
    </div>
  );
}