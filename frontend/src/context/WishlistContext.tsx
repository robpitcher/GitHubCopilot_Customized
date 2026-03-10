import { createContext, useContext, useState, ReactNode } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import axios from 'axios';
import { api } from '../api/config';
import { useAuth } from './AuthContext';

export interface Wishlist {
  wishlistId: number;
  userId: string;
  name: string;
  shareToken: string;
  createdAt: string;
  isPublic: boolean;
}

export interface WishlistItem {
  wishlistItemId: number;
  wishlistId: number;
  productId: number;
  addedAt: string;
}

interface WishlistContextType {
  wishlists: Wishlist[];
  activeWishlistId: number | null;
  activeWishlist: Wishlist | null;
  activeWishlistItems: WishlistItem[];
  setActiveWishlistId: (id: number | null) => void;
  createWishlist: (name: string) => Promise<void>;
  deleteWishlist: (id: number) => Promise<void>;
  addToWishlist: (productId: number) => Promise<void>;
  addToSpecificWishlist: (productId: number, wishlistId: number) => Promise<void>;
  removeFromWishlist: (itemId: number) => Promise<void>;
  isInActiveWishlist: (productId: number) => boolean;
  makePublic: (wishlistId: number) => Promise<void>;
  getShareUrl: (wishlistId: number) => string;
}

const WishlistContext = createContext<WishlistContextType | null>(null);

const fetchWishlists = async (userId: string): Promise<Wishlist[]> => {
  const { data } = await axios.get(
    `${api.baseURL}${api.endpoints.wishlists}?userId=${encodeURIComponent(userId)}`
  );
  return data;
};

const fetchWishlistItems = async (wishlistId: number): Promise<WishlistItem[]> => {
  const { data } = await axios.get(
    `${api.baseURL}${api.endpoints.wishlists}/${wishlistId}/items`
  );
  return data;
};

export function WishlistProvider({ children }: { children: ReactNode }) {
  const { userId } = useAuth();
  const queryClient = useQueryClient();
  const [activeWishlistId, setActiveWishlistId] = useState<number | null>(null);

  // Fetch wishlists for logged-in user
  const { data: wishlists = [] } = useQuery<Wishlist[]>(
    ['wishlists', userId],
    () => fetchWishlists(userId!),
    {
      enabled: !!userId,
      onSuccess: (data) => {
        // Auto-select the first wishlist if none selected
        if (data.length > 0 && activeWishlistId === null) {
          setActiveWishlistId(data[0].wishlistId);
        }
      },
    }
  );

  // Fetch items for the active wishlist
  const { data: activeWishlistItems = [] } = useQuery<WishlistItem[]>(
    ['wishlistItems', activeWishlistId],
    () => fetchWishlistItems(activeWishlistId!),
    { enabled: !!activeWishlistId }
  );

  const activeWishlist = wishlists.find(w => w.wishlistId === activeWishlistId) ?? null;

  // Create wishlist mutation
  const createMutation = useMutation(
    (name: string) =>
      axios.post(`${api.baseURL}${api.endpoints.wishlists}`, { userId, name }),
    {
      onSuccess: (response) => {
        queryClient.invalidateQueries(['wishlists', userId]);
        setActiveWishlistId(response.data.wishlistId);
      },
    }
  );

  // Delete wishlist mutation
  const deleteMutation = useMutation(
    (id: number) =>
      axios.delete(`${api.baseURL}${api.endpoints.wishlists}/${id}`),
    {
      onSuccess: (_data, id) => {
        queryClient.invalidateQueries(['wishlists', userId]);
        if (activeWishlistId === id) {
          setActiveWishlistId(null);
        }
      },
    }
  );

  // Add item mutation
  const addItemMutation = useMutation(
    (productId: number) =>
      axios.post(
        `${api.baseURL}${api.endpoints.wishlists}/${activeWishlistId}/items`,
        { productId }
      ),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['wishlistItems', activeWishlistId]);
      },
    }
  );

  // Add item to a specific wishlist (without changing active context)
  const addItemToSpecificMutation = useMutation(
    ({ productId, wishlistId }: { productId: number; wishlistId: number }) =>
      axios.post(
        `${api.baseURL}${api.endpoints.wishlists}/${wishlistId}/items`,
        { productId }
      ),
    {
      onSuccess: (_data, { wishlistId }) => {
        queryClient.invalidateQueries(['wishlistItems', wishlistId]);
      },
    }
  );

  // Remove item mutation
  const removeItemMutation = useMutation(
    (itemId: number) =>
      axios.delete(
        `${api.baseURL}${api.endpoints.wishlists}/${activeWishlistId}/items/${itemId}`
      ),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['wishlistItems', activeWishlistId]);
      },
    }
  );

  // Make public mutation
  const makePublicMutation = useMutation(
    (wishlistId: number) =>
      axios.put(`${api.baseURL}${api.endpoints.wishlists}/${wishlistId}`, {
        isPublic: true,
      }),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['wishlists', userId]);
      },
    }
  );

  const createWishlist = async (name: string) => {
    if (!userId) return;
    await createMutation.mutateAsync(name);
  };

  const deleteWishlist = async (id: number) => {
    if (!userId) return;
    await deleteMutation.mutateAsync(id);
  };

  const addToWishlist = async (productId: number) => {
    if (!userId || !activeWishlistId) return;
    await addItemMutation.mutateAsync(productId);
  };

  const addToSpecificWishlist = async (productId: number, wishlistId: number) => {
    if (!userId) return;
    await addItemToSpecificMutation.mutateAsync({ productId, wishlistId });
  };

  const removeFromWishlist = async (itemId: number) => {
    if (!userId || !activeWishlistId) return;
    await removeItemMutation.mutateAsync(itemId);
  };

  const isInActiveWishlist = (productId: number): boolean => {
    return activeWishlistItems.some(i => i.productId === productId);
  };

  const makePublic = async (wishlistId: number) => {
    if (!userId) return;
    await makePublicMutation.mutateAsync(wishlistId);
  };

  const getShareUrl = (wishlistId: number): string => {
    const wishlist = wishlists.find(w => w.wishlistId === wishlistId);
    if (!wishlist) return '';
    return `${window.location.origin}/wishlist/share/${wishlist.shareToken}`;
  };

  return (
    <WishlistContext.Provider
      value={{
        wishlists,
        activeWishlistId,
        activeWishlist,
        activeWishlistItems,
        setActiveWishlistId,
        createWishlist,
        deleteWishlist,
        addToWishlist,
        addToSpecificWishlist,
        removeFromWishlist,
        isInActiveWishlist,
        makePublic,
        getShareUrl,
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
