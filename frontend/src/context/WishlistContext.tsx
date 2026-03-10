import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import {
  getWishlist,
  addToWishlist as apiAddToWishlist,
  removeFromWishlist as apiRemoveFromWishlist,
  WishlistItem,
} from '../api/wishlist';
import { useAuth } from './AuthContext';

interface WishlistContextType {
  wishlistItems: WishlistItem[];
  wishlistCount: number;
  isLoading: boolean;
  error: string | null;
  isInWishlist: (productId: number) => boolean;
  addToWishlist: (productId: number) => Promise<void>;
  removeFromWishlist: (productId: number) => Promise<void>;
  refreshWishlist: () => Promise<void>;
}

const WishlistContext = createContext<WishlistContextType | null>(null);

export function WishlistProvider({ children }: { children: ReactNode }) {
  const { isLoggedIn } = useAuth();
  const [wishlistItems, setWishlistItems] = useState<WishlistItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refreshWishlist = useCallback(async () => {
    if (!isLoggedIn) {
      setWishlistItems([]);
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const items = await getWishlist();
      setWishlistItems(items);
    } catch {
      setError('Failed to load wishlist');
    } finally {
      setIsLoading(false);
    }
  }, [isLoggedIn]);

  useEffect(() => {
    refreshWishlist();
  }, [refreshWishlist]);

  const isInWishlist = (productId: number) =>
    wishlistItems.some(item => item.productId === productId);

  const addToWishlist = async (productId: number) => {
    await apiAddToWishlist(productId);
    await refreshWishlist();
  };

  const removeFromWishlist = async (productId: number) => {
    await apiRemoveFromWishlist(productId);
    await refreshWishlist();
  };

  return (
    <WishlistContext.Provider
      value={{
        wishlistItems,
        wishlistCount: wishlistItems.length,
        isLoading,
        error,
        isInWishlist,
        addToWishlist,
        removeFromWishlist,
        refreshWishlist,
      }}
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
