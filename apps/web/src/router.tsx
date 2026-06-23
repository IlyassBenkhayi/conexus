import { createBrowserRouter, Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from './store/useAuthStore';
import { Loader2 } from 'lucide-react';

// Pages
import Login from './pages/Auth/Login';
import SignUp from './pages/Auth/SignUp';
import RoomBrowser from './pages/Dashboard/RoomBrowser';
import RoomContainer from './pages/Room/Room';

// Auth Guard Component — waits for initial session check before redirecting
const ProtectedRoute = () => {
  const session = useAuthStore(state => state.session);
  const initializing = useAuthStore(state => state.initializing);

  // Still waiting for getSession() to resolve — don't redirect yet
  if (initializing) {
    return (
      <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Loader2 className="animate-spin" size={48} color="var(--accent-primary)" />
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
};

export const router = createBrowserRouter([
  {
    path: '/login',
    element: <Login />
  },
  {
    path: '/signup',
    element: <SignUp />
  },
  {
    element: <ProtectedRoute />,
    children: [
      {
        path: '/',
        element: <RoomBrowser />
      },
      {
        path: '/room/:id',
        element: <RoomContainer />
      }
    ]
  }
]);
