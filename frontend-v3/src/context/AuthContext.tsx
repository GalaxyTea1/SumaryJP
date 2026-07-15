// ============================================
// AuthContext — SumaryJP
// React 19: useActionState cho login/register
// ============================================

import {
  createContext, useContext, useState,
  useCallback, useEffect, type ReactNode,
} from 'react';
import { api, AUTH_TOKEN_KEY, sessionCache } from '@/api';
import type { User } from '@/types';

// ---- Types ----
interface AuthState {
  user: User | null;
  isLoading: boolean;
  isLoggedIn: boolean;
  isAdmin: boolean;
}

interface AuthContextValue extends AuthState {
  login:  (username: string, password: string) => Promise<void>;
  register: (username: string, password: string) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

// ---- Context ----
const AuthContext = createContext<AuthContextValue | null>(null);

// ---- JWT Helper ----
function decodeToken(token: string): { role?: string } | null {
  try {
    const payload = token.split('.')[1];
    return JSON.parse(atob(payload)) as { role?: string };
  } catch {
    return null;
  }
}

// ---- Provider ----
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Verify token on mount
  const refreshUser = useCallback(async () => {
    const token = localStorage.getItem(AUTH_TOKEN_KEY);
    if (!token) {
      setUser(null);
      setIsLoading(false);
      return;
    }

    try {
      const data = await api.getMe();
      setUser(data.user ?? (data as unknown as User));
    } catch {
      localStorage.removeItem(AUTH_TOKEN_KEY);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    void refreshUser();
  }, [refreshUser]);
  /* eslint-enable react-hooks/set-state-in-effect */

  // Login — React 19: có thể dùng với useActionState
  const login = useCallback(async (username: string, password: string) => {
    const data = await api.login(username, password);
    if (data.token) {
      localStorage.setItem(AUTH_TOKEN_KEY, data.token);
    }
    setUser(data.user);
  }, []);

  // Register
  const register = useCallback(async (username: string, password: string) => {
    const data = await api.register(username, password);
    if (data.token) {
      localStorage.setItem(AUTH_TOKEN_KEY, data.token);
    }
    setUser(data.user);
  }, []);

  // Logout
  const logout = useCallback(() => {
    localStorage.removeItem(AUTH_TOKEN_KEY);
    sessionCache.invalidateAll();
    setUser(null);
  }, []);

  const token = localStorage.getItem(AUTH_TOKEN_KEY);
  const tokenPayload = token ? decodeToken(token) : null;

  const value: AuthContextValue = {
    user,
    isLoading,
    isLoggedIn: !!user,
    isAdmin: (tokenPayload?.role ?? user?.role) === 'admin',
    login,
    register,
    logout,
    refreshUser,
  };

  return <AuthContext value={value}>{children}</AuthContext>;
}

// ---- Hook ----
// eslint-disable-next-line react-refresh/only-export-components
export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth phải dùng trong AuthProvider');
  return ctx;
}
