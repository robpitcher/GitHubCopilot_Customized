/* eslint-disable react-refresh/only-export-components */
import React, { useContext, useState, useEffect } from 'react';
import { WishlistContext } from './wishlistContextUtils';

const WISHLIST_STORAGE_KEY = 'octocat-wishlist';

export const useWishlist = () => {
  const context = useContext(WishlistContext);
  if (context === undefined) {
    throw new Error('useWishlist must be used within a WishlistProvider');
  }
  return context;
};

export function WishlistProvider({ children }: { children: React.ReactNode }) {
  const [wishlistIds, setWishlistIds] = useState<number[]>(() => {
    try {
      const stored = localStorage.getItem(WISHLIST_STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem(WISHLIST_STORAGE_KEY, JSON.stringify(wishlistIds));
  }, [wishlistIds]);

  const addToWishlist = (productId: number) => {
    setWishlistIds(prev => prev.includes(productId) ? prev : [...prev, productId]);
  };

  const removeFromWishlist = (productId: number) => {
    setWishlistIds(prev => prev.filter(id => id !== productId));
  };

  const isInWishlist = (productId: number) => wishlistIds.includes(productId);

  const clearWishlist = () => setWishlistIds([]);

  return (
    <WishlistContext.Provider value={{ wishlistIds, addToWishlist, removeFromWishlist, isInWishlist, clearWishlist }}>
      {children}
    </WishlistContext.Provider>
  );
}
