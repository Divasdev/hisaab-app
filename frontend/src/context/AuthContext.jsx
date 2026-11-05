import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router';
import { api } from '../api';
import { getToken } from '../api/client';
import { Splash } from '../components/ui/Splash';

const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let alive = true;
    (getToken() ? api.getMe() : Promise.resolve(null))
      .then((u) => alive && setUser(u))
      .catch(() => alive && setUser(null))
      .finally(() => alive && setReady(true));
    const onLoggedOut = () => setUser(null);
    window.addEventListener('hisaab:logged-out', onLoggedOut);
    return () => {
      alive = false;
      window.removeEventListener('hisaab:logged-out', onLoggedOut);
    };
  }, []);

  const login = useCallback(async (email, password) => {
    const { user: u } = await api.login({ email, password });
    setUser(u);
    return u;
  }, []);
  const signup = useCallback(async (fields) => {
    const { user: u } = await api.signup(fields);
    setUser(u);
    return u;
  }, []);
  const updateProfile = useCallback(async (changes) => {
    const u = await api.updateMe(changes);
    setUser(u);
    return u;
  }, []);
  const logout = useCallback(() => {
    api.logout();
    setUser(null);
  }, []);

  const value = useMemo(() => ({ user, ready, login, signup, logout, updateProfile }), [user, ready, login, signup, logout, updateProfile]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/** Layout route: only logged-in people get through; others go to /login and come back after. */
export function RequireAuth() {
  const { user, ready } = useAuth();
  const location = useLocation();
  if (!ready) return <Splash />;
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />;
  return <Outlet />;
}

/**
 * Layout route for /login and /signup. Someone who arrives already logged in is sent on.
 * After logging in here, the page itself decides where to go (signup goes to /welcome first).
 */
export function GuestOnly() {
  const { user, ready } = useAuth();
  const location = useLocation();
  const arrivedLoggedIn = useRef(null);
  if (ready && arrivedLoggedIn.current === null) arrivedLoggedIn.current = !!user;
  if (!ready) return <Splash />;
  if (arrivedLoggedIn.current && user) return <Navigate to={location.state?.from || '/'} replace />;
  return <Outlet />;
}
