// Admin session state: /auth/me on load, login, logout, and a redirect to /login on any 401 (PRD §9.1).
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { Navigate, Outlet, useLocation, useNavigate } from 'react-router';
import { ApiError, get, post, setCsrfToken, setUnauthorizedHandler } from './api';
import type { AdminIdentity } from './types';

type Session = { admin: AdminIdentity; csrfToken: string };
type AuthState = {
  admin: AdminIdentity | null;
  checking: boolean;
  login: (input: { username: string; password: string; code: string }) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [admin, setAdmin] = useState<AdminIdentity | null>(null);
  const [checking, setChecking] = useState(true);
  const navigate = useNavigate();

  const signedOut = useCallback(() => {
    setCsrfToken(null);
    setAdmin(null);
  }, []);

  useEffect(() => {
    get<Session>('/auth/me')
      .then((s) => {
        setCsrfToken(s.csrfToken);
        setAdmin(s.admin);
      })
      .catch(signedOut)
      .finally(() => setChecking(false));
  }, [signedOut]);

  useEffect(() => {
    setUnauthorizedHandler(() => {
      signedOut();
      navigate('/login', { replace: true });
    });
    return () => setUnauthorizedHandler(null);
  }, [navigate, signedOut]);

  const login = useCallback(async (input: { username: string; password: string; code: string }) => {
    const s = await post<Session>('/auth/login', input);
    setCsrfToken(s.csrfToken);
    setAdmin(s.admin);
  }, []);

  const logout = useCallback(async () => {
    try {
      await post('/auth/logout');
    } catch (err) {
      if (!(err instanceof ApiError && err.status === 401)) throw err;
    }
    signedOut();
    navigate('/login', { replace: true });
  }, [navigate, signedOut]);

  const value = useMemo(() => ({ admin, checking, login, logout }), [admin, checking, login, logout]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth outside AuthProvider');
  return ctx;
}

/** Route guard: waits for /auth/me, then shows the panel or sends the admin to /login. */
export function RequireAdmin() {
  const { admin, checking } = useAuth();
  const location = useLocation();
  if (checking) {
    return (
      <div className="grid min-h-screen place-items-center text-sm text-ink-3" role="status">
        در حال بررسی نشست…
      </div>
    );
  }
  if (!admin) return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />;
  return <Outlet />;
}
