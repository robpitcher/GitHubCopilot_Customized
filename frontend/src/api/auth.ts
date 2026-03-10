import axios from 'axios';
import { api } from './config';

export interface AuthUser {
    userId: number;
    email: string;
    name: string;
    createdAt: string;
}

export interface AuthResponse {
    token: string;
    user: AuthUser;
}

export async function register(email: string, name: string, password: string): Promise<AuthResponse> {
    const { data } = await axios.post<AuthResponse>(`${api.baseURL}${api.endpoints.auth.register}`, {
        email,
        name,
        password
    });
    return data;
}

export async function login(email: string, password: string): Promise<AuthResponse> {
    const { data } = await axios.post<AuthResponse>(`${api.baseURL}${api.endpoints.auth.login}`, {
        email,
        password
    });
    return data;
}

export async function getMe(token: string): Promise<AuthUser> {
    const { data } = await axios.get<AuthUser>(`${api.baseURL}${api.endpoints.auth.me}`, {
        headers: { Authorization: `Bearer ${token}` }
    });
    return data;
}
