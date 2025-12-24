'use client';

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from 'react';
import { api, User } from './api';

interface AuthContextType {
  user: User | null;
  accessToken: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const ACCESS_TOKEN_KEY = 'a-hub-access-token';
const REFRESH_TOKEN_KEY = 'a-hub-refresh-token';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const clearAuth = useCallback(() => {
    setUser(null);
    setAccessToken(null);
    if (typeof window !== 'undefined') {
      localStorage.removeItem(ACCESS_TOKEN_KEY);
      localStorage.removeItem(REFRESH_TOKEN_KEY);
    }
  }, []);

  const initAuth = useCallback(async () => {
    if (typeof window === 'undefined') {
      setIsLoading(false);
      return;
    }

    const storedAccessToken = localStorage.getItem(ACCESS_TOKEN_KEY);
    const storedRefreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);

    if (!storedAccessToken || !storedRefreshToken) {
      setIsLoading(false);
      return;
    }

    try {
      // Try to get user with stored access token
      const userData = await api.getMe(storedAccessToken);
      setUser(userData);
      setAccessToken(storedAccessToken);
    } catch {
      // Token might be expired, try to refresh
      try {
        const tokens = await api.refreshToken(storedRefreshToken);
        localStorage.setItem(ACCESS_TOKEN_KEY, tokens.accessToken);
        localStorage.setItem(REFRESH_TOKEN_KEY, tokens.refreshToken);
        setAccessToken(tokens.accessToken);

        const userData = await api.getMe(tokens.accessToken);
        setUser(userData);
      } catch {
        clearAuth();
      }
    } finally {
      setIsLoading(false);
    }
  }, [clearAuth]);

  useEffect(() => {
    initAuth();
  }, [initAuth]);

  const login = async (email: string, password: string) => {
    const response = await api.login(email, password);
    localStorage.setItem(ACCESS_TOKEN_KEY, response.accessToken);
    localStorage.setItem(REFRESH_TOKEN_KEY, response.refreshToken);
    setAccessToken(response.accessToken);
    setUser(response.user);
  };

  const register = async (name: string, email: string, password: string) => {
    const response = await api.register(name, email, password);
    localStorage.setItem(ACCESS_TOKEN_KEY, response.accessToken);
    localStorage.setItem(REFRESH_TOKEN_KEY, response.refreshToken);
    setAccessToken(response.accessToken);
    setUser(response.user);
  };

  const logout = async () => {
    if (accessToken) {
      try {
        await api.logout(accessToken);
      } catch {
        // Ignore errors during logout
      }
    }
    clearAuth();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        accessToken,
        isLoading,
        isAuthenticated: !!user,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
