import axios from 'axios';
import { api } from './config';
import { getStoredToken } from './auth';

export interface WishlistItem {
  wishlistId: number;
  productId: number;
  addedAt: string;
  product: {
    productId: number;
    name: string;
    description: string;
    price: number;
    imgName: string;
    sku: string;
    unit: string;
    supplierId: number;
    discount?: number;
  } | null;
}

function getAuthHeaders() {
  const token = getStoredToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function getWishlist(): Promise<WishlistItem[]> {
  const { data } = await axios.get<WishlistItem[]>(`${api.baseURL}/api/wishlist`, {
    headers: getAuthHeaders(),
  });
  return data;
}

export async function addToWishlist(productId: number): Promise<void> {
  await axios.post(
    `${api.baseURL}/api/wishlist`,
    { productId },
    { headers: getAuthHeaders() }
  );
}

export async function removeFromWishlist(productId: number): Promise<void> {
  await axios.delete(`${api.baseURL}/api/wishlist/${productId}`, {
    headers: getAuthHeaders(),
  });
}
