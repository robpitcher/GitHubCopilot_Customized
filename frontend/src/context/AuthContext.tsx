import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { login as apiLogin, logout as apiLogout, register as apiRegister, getCurrentUser, AuthUser } from '../api/auth';

interface AuthContextType {
  isLoggedIn: boolean;
  isAdmin: boolean;
  user: AuthUser | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  register: (email: string, password: string, name: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [user, setUser] = useState<AuthUser | null>(null);

  // Restore session from stored token on mount
  useEffect(() => {
    getCurrentUser().then(currentUser => {
      if (currentUser) {
        setUser(currentUser);
        setIsLoggedIn(true);
        setIsAdmin(currentUser.email.endsWith('@github.com'));
      }
    });
  }, []);

  const login = async (email: string, password: string) => {
    const { user: loggedInUser } = await apiLogin(email, password);
    setUser(loggedInUser);
    setIsLoggedIn(true);
    setIsAdmin(loggedInUser.email.endsWith('@github.com'));
  };

  const register = async (email: string, password: string, name: string) => {
    const { user: registeredUser } = await apiRegister(email, password, name);
    setUser(registeredUser);
    setIsLoggedIn(true);
    setIsAdmin(registeredUser.email.endsWith('@github.com'));
  };

  const logout = () => {
    apiLogout();
    setIsLoggedIn(false);
    setIsAdmin(false);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ isLoggedIn, isAdmin, user, login, logout, register }}>
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