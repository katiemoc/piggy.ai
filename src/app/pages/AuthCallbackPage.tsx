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
      loginWithToken(token, JSON.parse(user));
      if (window.opener) {
        window.close();
      } else {
        navigate('/upload');
      }
    } else {
      if (window.opener) {
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