import axios from 'axios';
import { api } from './config';

const AUTH_TOKEN_KEY = 'octocat-auth-token';

export interface AuthUser {
  userId: number;
  email: string;
  name: string;
}

export interface AuthResponse {
  token: string;
  user: AuthUser;
}

function getAuthHeaders() {
  const token = localStorage.getItem(AUTH_TOKEN_KEY);
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function register(email: string, password: string, name: string): Promise<AuthResponse> {
  const { data } = await axios.post<AuthResponse>(`${api.baseURL}/api/auth/register`, {
    email,
    password,
    name,
  });
  localStorage.setItem(AUTH_TOKEN_KEY, data.token);
  return data;
}

export async function login(email: string, password: string): Promise<AuthResponse> {
  const { data } = await axios.post<AuthResponse>(`${api.baseURL}/api/auth/login`, {
    email,
    password,
  });
  localStorage.setItem(AUTH_TOKEN_KEY, data.token);
  return data;
}

export function logout(): void {
  localStorage.removeItem(AUTH_TOKEN_KEY);
}

export async function getCurrentUser(): Promise<AuthUser | null> {
  const token = localStorage.getItem(AUTH_TOKEN_KEY);
  if (!token) return null;
  try {
    const { data } = await axios.get<AuthUser>(`${api.baseURL}/api/auth/me`, {
      headers: getAuthHeaders(),
    });
    return data;
  } catch {
    localStorage.removeItem(AUTH_TOKEN_KEY);
    return null;
  }
}

export function getStoredToken(): string | null {
  return localStorage.getItem(AUTH_TOKEN_KEY);
}
