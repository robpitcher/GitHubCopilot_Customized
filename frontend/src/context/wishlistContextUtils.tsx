import { createContext } from 'react';

export type WishlistContextType = {
  wishlistIds: number[];
  addToWishlist: (productId: number) => void;
  removeFromWishlist: (productId: number) => void;
  isInWishlist: (productId: number) => boolean;
  clearWishlist: () => void;
};

export const WishlistContext = createContext<WishlistContextType | undefined>(undefined);
