import { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
import { api } from '../api/client.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [admin, setAdmin] = useState(null);
  const [loading, setLoading] = useState(true);

  // On load: use the existing session, or silently refresh it once.
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await api.get('/auth/me');
        if (alive) setAdmin(res.data.admin);
      } catch (e) {
        if (e.status === 401) {
          try {
            const res = await api.post('/auth/refresh');
            if (alive) setAdmin(res.data.admin);
          } catch { if (alive) setAdmin(null); }
        } else if (alive) setAdmin(null);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, []);

  // Refresh failed somewhere in the app → back to signed-out state.
  useEffect(() => {
    const onExpired = () => setAdmin(null);
    window.addEventListener('auth:expired', onExpired);
    return () => window.removeEventListener('auth:expired', onExpired);
  }, []);

  const login = useCallback(async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    setAdmin(res.data.admin);
  }, []);

  const logout = useCallback(async () => {
    try { await api.post('/auth/logout'); } finally { setAdmin(null); }
  }, []);

  const can = useCallback((perm) => !!admin?.permissions?.includes(perm), [admin]);

  const value = useMemo(() => ({ admin, loading, login, logout, can }), [admin, loading, login, logout, can]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
