/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import axios from 'axios';
import { useQuery, useQueryClient } from 'react-query';
import { api } from '../api/config';
import { useAuth } from './AuthContext';

export interface WishlistItem {
  wishlistItemId: number;
  userId: string;
  productId: number;
  addedAt: string;
  priceAtTimeOfAdding: number;
  name?: string;
  currentPrice?: number;
  imgName?: string;
  discount?: number;
  sku?: string;
  priceDrop?: number;
}

interface LocalWishlistItem {
  productId: number;
  addedAt: string;
}

interface WishlistContextType {
  items: WishlistItem[];
  isLoading: boolean;
  error: unknown;
  addToWishlist: (productId: number) => Promise<void>;
  removeFromWishlist: (productId: number) => Promise<void>;
  isInWishlist: (productId: number) => boolean;
}

const WishlistContext = createContext<WishlistContextType | null>(null);

const LOCAL_STORAGE_KEY = 'wishlist_local';

function getLocalItems(): LocalWishlistItem[] {
  try {
    const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
    return stored ? (JSON.parse(stored) as LocalWishlistItem[]) : [];
  } catch {
    return [];
  }
}

function setLocalItems(items: LocalWishlistItem[]) {
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(items));
}

export function WishlistProvider({ children }: { children: ReactNode }) {
  const { userId } = useAuth();
  const queryClient = useQueryClient();
  const [localItems, setLocalItemsState] = useState<LocalWishlistItem[]>(getLocalItems);

  // Sync local items to state when localStorage changes externally
  useEffect(() => {
    if (!userId) {
      setLocalItemsState(getLocalItems());
    }
  }, [userId]);

  const fetchWishlist = async (): Promise<WishlistItem[]> => {
    if (!userId) return [];
    const { data } = await axios.get(
      `${api.baseURL}${api.endpoints.wishlist}?userId=${encodeURIComponent(userId)}`
    );
    return data;
  };

  const {
    data: apiItems,
    isLoading,
    error,
  } = useQuery(['wishlist', userId], fetchWishlist, {
    enabled: !!userId,
  });

  // When logged in, use API items; otherwise use local items as WishlistItem-shaped objects
  const items: WishlistItem[] = userId
    ? (apiItems ?? [])
    : localItems.map(li => ({
        wishlistItemId: li.productId,
        userId: '',
        productId: li.productId,
        addedAt: li.addedAt,
        priceAtTimeOfAdding: 0,
      }));

  const addToWishlist = async (productId: number) => {
    if (userId) {
      await axios.post(`${api.baseURL}${api.endpoints.wishlist}`, { userId, productId });
      queryClient.invalidateQueries(['wishlist', userId]);
    } else {
      const current = getLocalItems();
      if (!current.find(i => i.productId === productId)) {
        const updated = [...current, { productId, addedAt: new Date().toISOString() }];
        setLocalItems(updated);
        setLocalItemsState(updated);
      }
    }
  };

  const removeFromWishlist = async (productId: number) => {
    if (userId) {
      const item = apiItems?.find(i => i.productId === productId);
      if (item) {
        await axios.delete(
          `${api.baseURL}${api.endpoints.wishlist}/${item.wishlistItemId}`
        );
        queryClient.invalidateQueries(['wishlist', userId]);
      }
    } else {
      const updated = getLocalItems().filter(i => i.productId !== productId);
      setLocalItems(updated);
      setLocalItemsState(updated);
    }
  };

  const isInWishlist = (productId: number): boolean => {
    return items.some(i => i.productId === productId);
  };

  return (
    <WishlistContext.Provider
      value={{ items, isLoading, error, addToWishlist, removeFromWishlist, isInWishlist }}
    >
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  const context = useContext(WishlistContext);
  if (!context) {
    throw new Error('useWishlist must be used within a WishlistProvider');
  }
  return context;
}
