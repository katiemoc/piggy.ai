import { createBrowserRouter, Navigate, useNavigate } from 'react-router';
import { Layout } from './components/Layout';
import { UploadScreen } from './components/UploadScreen';
import { Dashboard } from './components/Dashboard';
import { HistoryPage } from './pages/HistoryPage';
import { AIPage } from './pages/AIPage';
import { GamifyPage } from './pages/GamifyPage';
import { ProfilePage } from './pages/ProfilePage';
import { LoginPage } from './pages/LoginPage';
import { SignupPage } from './pages/SignupPage';
import { AuthCallbackPage } from './pages/AuthCallbackPage';
import { useAuth } from './auth';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isLoggedIn } = useAuth();
  if (!isLoggedIn) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function HomePageWrapper() {
  const navigate = useNavigate();
  return (
    <div className="size-full bg-[#f5f5f0] text-[#1a1a1a]">
      <UploadScreen onUpload={() => navigate('/dashboard')} />
    </div>
  );
}

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Navigate to="/profile" replace />,
  },
  {
    path: '/login',
    Component: LoginPage,
  },
  {
    path: '/signup',
    Component: SignupPage,
  },
  {
    path: '/auth/callback',
    Component: AuthCallbackPage,
  },
  {
    path: '/upload',
    element: <ProtectedRoute><HomePageWrapper /></ProtectedRoute>,
  },
  {
    path: '/',
    element: <ProtectedRoute><Layout /></ProtectedRoute>,
    children: [
      { path: 'dashboard', Component: Dashboard },
      { path: 'ai', Component: AIPage },
      { path: 'history', Component: HistoryPage },
      { path: 'gamify', Component: GamifyPage },
      { path: 'profile', Component: ProfilePage },
    ],
  },
  {
    path: '*',
    element: <Navigate to="/login" replace />,
  },
]);
