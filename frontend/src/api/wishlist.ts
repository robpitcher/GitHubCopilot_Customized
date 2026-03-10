import axios from 'axios';
import { api } from './config';

export interface WishlistItem {
    wishlistId: number;
    userId: number;
    productId: number;
    addedAt: string;
}

function authHeader(token: string) {
    return { Authorization: `Bearer ${token}` };
}

export async function getWishlist(token: string): Promise<WishlistItem[]> {
    const { data } = await axios.get<WishlistItem[]>(`${api.baseURL}${api.endpoints.wishlist}`, {
        headers: authHeader(token)
    });
    return data;
}

export async function addToWishlist(token: string, productId: number): Promise<WishlistItem> {
    const { data } = await axios.post<WishlistItem>(`${api.baseURL}${api.endpoints.wishlist}`, { productId }, {
        headers: authHeader(token)
    });
    return data;
}

export async function bulkSyncWishlist(token: string, productIds: number[]): Promise<WishlistItem[]> {
    const { data } = await axios.post<WishlistItem[]>(`${api.baseURL}${api.endpoints.wishlist}/bulk`, { productIds }, {
        headers: authHeader(token)
    });
    return data;
}

export async function removeFromWishlist(token: string, productId: number): Promise<void> {
    await axios.delete(`${api.baseURL}${api.endpoints.wishlist}/${productId}`, {
        headers: authHeader(token)
    });
}
