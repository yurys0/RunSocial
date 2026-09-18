import { createContext, ReactNode, useCallback, useContext, useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';

import { ApiError, gql, rest, tokenStorage } from '../shared/api/client';

export type CurrentUser = {
  id: string;
  login: string;
  displayName: string;
  avatarUrl: string | null;
};

type AuthContextValue = {
  user: CurrentUser | null;
  loading: boolean;
  login: (login: string, password: string) => Promise<void>;
  register: (login: string, password: string, displayName: string) => Promise<void>;
  logout: () => void;
  refresh: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

type AuthResponse = { accessToken: string; user: CurrentUser };

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [loading, setLoading] = useState(true);

  /** Токен переживает перезагрузку, поэтому при старте его проверяем. */
  const refresh = useCallback(async () => {
    if (!tokenStorage.get()) {
      setUser(null);
      setLoading(false);
      return;
    }
    try {
      const data = await gql<{ me: CurrentUser }>(
        '{ me { id login displayName avatarUrl } }',
      );
      setUser(data.me);
    } catch (error) {
      // Протухший токен убираем, чтобы не показывать приватные страницы
      if (error instanceof ApiError && error.status === 401) {
        tokenStorage.clear();
      }
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const applyAuth = (response: AuthResponse) => {
    tokenStorage.set(response.accessToken);
    setUser(response.user);
  };

  const value: AuthContextValue = {
    user,
    loading,
    login: async (login, password) => {
      applyAuth(await rest<AuthResponse>('/auth/login', { method: 'POST', body: { login, password } }));
    },
    register: async (login, password, displayName) => {
      applyAuth(
        await rest<AuthResponse>('/auth/register', {
          method: 'POST',
          body: { login, password, displayName },
        }),
      );
    },
    logout: () => {
      tokenStorage.clear();
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
