import { createContext, ReactNode, useCallback, useContext, useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';

import { hasSession, isAdmin, signIn, signOut, signUp } from '../shared/api/auth';
import { gql } from '../shared/api/client';

export type CurrentUser = {
  id: string;
  login: string;
  displayName: string;
  avatarUrl: string | null;
  isAdmin: boolean;
};

type AuthContextValue = {
  user: CurrentUser | null;
  loading: boolean;
  login: (login: string, password: string) => Promise<void>;
  register: (login: string, password: string, displayName: string) => Promise<void>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

type Profile = Omit<CurrentUser, 'isAdmin'>;

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [loading, setLoading] = useState(true);

  /** Сессия переживает перезагрузку, поэтому при старте её проверяем. */
  const refresh = useCallback(async () => {
    if (!(await hasSession())) {
      setUser(null);
      setLoading(false);
      return;
    }
    try {
      const [data, admin] = await Promise.all([
        gql<{ me: Profile }>('{ me { id login displayName avatarUrl } }'),
        isAdmin(),
      ]);
      setUser({ ...data.me, isAdmin: admin });
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const value: AuthContextValue = {
    user,
    loading,
    login: async (login, password) => {
      await signIn(login, password);
      await refresh();
    },
    register: async (login, password, displayName) => {
      await signUp(login, password, displayName);
      await refresh();
    },
    logout: async () => {
      await signOut();
      setUser(null);
    },
    refresh,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth используется вне AuthProvider');
  }
  return context;
}

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <div className="container spinner">Загрузка…</div>;
  }
  return user ? <>{children}</> : <Navigate to="/login" state={{ from: location.pathname }} replace />;
}

/** Ссылки на админку в интерфейсе нет: чужой пользователь уходит на главную. */
export function AdminRoute({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="container spinner">Загрузка…</div>;
  }
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  return user.isAdmin ? <>{children}</> : <Navigate to="/" replace />;
}
