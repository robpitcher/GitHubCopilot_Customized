import { createContext, useContext, useState, ReactNode } from 'react';
import axios from 'axios';
import { api } from '../api/config';

interface AuthContextType {
  isLoggedIn: boolean;
  isAdmin: boolean;
  userId: number | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isLoggedIn, setIsLoggedIn] = useState(() => !!localStorage.getItem('authToken'));
  const [isAdmin, setIsAdmin] = useState(false);
  const [userId, setUserId] = useState<number | null>(() => {
    const stored = localStorage.getItem('authUserId');
    return stored ? parseInt(stored) : null;
  });

  const login = async (email: string, password: string) => {
    if (!email || !password) return;
    try {
      // Try the real API login
      const { data } = await axios.post(`${api.baseURL}${api.endpoints.auth}/login`, { email, password });
      localStorage.setItem('authToken', data.token);
      localStorage.setItem('authUserId', String(data.user.userId));
      setIsLoggedIn(true);
      setIsAdmin(email.endsWith('@github.com'));
      setUserId(data.user.userId);
    } catch {
      // Fallback: accept any valid email/password for demo
      setIsLoggedIn(true);
      setIsAdmin(email.endsWith('@github.com'));
      setUserId(null);
    }
  };

  const logout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('authUserId');
    setIsLoggedIn(false);
    setIsAdmin(false);
    setUserId(null);
  };

  return (
    <AuthContext.Provider value={{ isLoggedIn, isAdmin, userId, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}