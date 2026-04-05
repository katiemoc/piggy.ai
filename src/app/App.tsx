import { RouterProvider } from 'react-router';
import { router } from './routes';
import { AuthProvider } from './auth';
import { ToneProvider } from './context/ToneContext';

export default function App() {
  return (
    <AuthProvider>
      <ToneProvider>
        <RouterProvider router={router} />
      </ToneProvider>
    </AuthProvider>
  );
}
