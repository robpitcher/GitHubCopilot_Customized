import { createContext, useContext, ReactNode } from 'react';
import axios from 'axios';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { api } from '../api/config';
import { useAuth } from './AuthContext';

export interface WishlistItem {
  wishlistItemId: number;
  userId: string;
  productId: number;
  addedAt: string;
}

interface WishlistContextType {
  wishlistItems: WishlistItem[];
  isLoading: boolean;
  addToWishlist: (productId: number) => void;
  removeFromWishlist: (wishlistItemId: number) => void;
  isInWishlist: (productId: number) => boolean;
}

const WishlistContext = createContext<WishlistContextType | null>(null);

const fetchWishlist = async (userId: string): Promise<WishlistItem[]> => {
  const { data } = await axios.get(
    `${api.baseURL}${api.endpoints.wishlist}?userId=${encodeURIComponent(userId)}`
  );
  return data;
};

export function WishlistProvider({ children }: { children: ReactNode }) {
  const { isLoggedIn, userId } = useAuth();
  const queryClient = useQueryClient();

  const { data: wishlistItems = [], isLoading } = useQuery<WishlistItem[]>(
    ['wishlist', userId],
    () => fetchWishlist(userId!),
    {
      enabled: isLoggedIn && !!userId,
    }
  );

  const addMutation = useMutation(
    (productId: number) =>
      axios.post(`${api.baseURL}${api.endpoints.wishlist}`, { userId, productId }),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['wishlist', userId]);
      },
    }
  );

  const removeMutation = useMutation(
    (wishlistItemId: number) =>
      axios.delete(`${api.baseURL}${api.endpoints.wishlist}/${wishlistItemId}`),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['wishlist', userId]);
      },
    }
  );

  const addToWishlist = (productId: number) => {
    if (!isLoggedIn || !userId) {
      alert('Please log in to save items to your wishlist.');
      return;
    }
    addMutation.mutate(productId);
  };

  const removeFromWishlist = (wishlistItemId: number) => {
    if (!isLoggedIn) return;
    removeMutation.mutate(wishlistItemId);
  };

  const isInWishlist = (productId: number): boolean => {
    return wishlistItems.some(item => item.productId === productId);
  };

  return (
    <WishlistContext.Provider
      value={{ wishlistItems, isLoading, addToWishlist, removeFromWishlist, isInWishlist }}
    >
      {children}
    </WishlistContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useWishlist() {
  const context = useContext(WishlistContext);
  if (!context) {
    throw new Error('useWishlist must be used within a WishlistProvider');
  }
  return context;
}
