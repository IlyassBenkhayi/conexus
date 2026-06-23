import { useEffect } from 'react';
import { RouterProvider } from 'react-router-dom';
import { router } from './router';
import { getProfile, clearToken } from './lib/api';
import { useAuthStore } from './store/useAuthStore';

function App() {
  const setSession = useAuthStore((state) => state.setSession);
  const setUser = useAuthStore((state) => state.setUser);
  const setInitializing = useAuthStore((state) => state.setInitializing);

  useEffect(() => {
    // On mount, check localStorage for an existing JWT and restore session
    const token = localStorage.getItem('conexus-token');
    const userId = localStorage.getItem('conexus-user-id');

    if (token && userId) {
      // Validate token is still good by fetching the profile
      getProfile(userId)
        .then((profile) => {
          setSession({ token, userId });
          setUser(profile);
        })
        .catch(() => {
          // Token expired or invalid — clear it
          clearToken();
          localStorage.removeItem('conexus-user-id');
        })
        .finally(() => {
          setInitializing(false);
        });
    } else {
      setInitializing(false);
    }
  }, [setSession, setUser, setInitializing]);

  return <RouterProvider router={router} />;
}

export default App;
