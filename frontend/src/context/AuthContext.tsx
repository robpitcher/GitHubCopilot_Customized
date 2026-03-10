import { createContext, useContext, useState, ReactNode } from 'react';
import * as authApi from '../api/auth';

interface AuthUser {
    userId: number;
    email: string;
    name: string;
    createdAt: string;
}

interface AuthContextType {
    isLoggedIn: boolean;
    isAdmin: boolean;
    user: AuthUser | null;
    token: string | null;
    login: (email: string, password: string, onSync?: (token: string) => Promise<void>) => Promise<void>;
    register: (email: string, name: string, password: string, onSync?: (token: string) => Promise<void>) => Promise<void>;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<AuthUser | null>(null);
    const [token, setToken] = useState<string | null>(null);

    const isLoggedIn = user !== null;
    const isAdmin = user?.email?.endsWith('@github.com') ?? false;

    const login = async (email: string, password: string, onSync?: (token: string) => Promise<void>) => {
        const response = await authApi.login(email, password);
        setToken(response.token);
        setUser(response.user);
        if (onSync) {
            await onSync(response.token);
        }
    };

    const register = async (email: string, name: string, password: string, onSync?: (token: string) => Promise<void>) => {
        const response = await authApi.register(email, name, password);
        setToken(response.token);
        setUser(response.user);
        if (onSync) {
            await onSync(response.token);
        }
    };

    const logout = () => {
        setUser(null);
        setToken(null);
    };

    return (
        <AuthContext.Provider value={{ isLoggedIn, isAdmin, user, token, login, register, logout }}>
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