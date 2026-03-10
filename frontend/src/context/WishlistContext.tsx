import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import * as wishlistApi from '../api/wishlist';

const STORAGE_KEY = 'octocat-wishlist';

interface WishlistContextType {
    wishlistIds: number[];
    isInWishlist: (productId: number) => boolean;
    toggleWishlist: (productId: number) => void;
    syncWithApi: (token: string) => Promise<void>;
    clearLocalWishlist: () => void;
    wishlistCount: number;
}

const WishlistContext = createContext<WishlistContextType | null>(null);

function getLocalWishlist(): number[] {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        return raw ? JSON.parse(raw) : [];
    } catch {
        return [];
    }
}

function saveLocalWishlist(ids: number[]): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
}

export function WishlistProvider({ children }: { children: ReactNode }) {
    const [localIds, setLocalIds] = useState<number[]>(() => getLocalWishlist());
    const [apiIds, setApiIds] = useState<number[]>([]);
    const [token, setToken] = useState<string | null>(null);

    const isAuthenticated = token !== null;
    const wishlistIds = isAuthenticated ? apiIds : localIds;

    const isInWishlist = useCallback(
        (productId: number) => wishlistIds.includes(productId),
        [wishlistIds]
    );

    const toggleWishlist = useCallback(
        async (productId: number) => {
            if (isAuthenticated && token) {
                // Optimistic UI update
                const alreadyIn = apiIds.includes(productId);
                const updated = alreadyIn
                    ? apiIds.filter(id => id !== productId)
                    : [...apiIds, productId];
                setApiIds(updated);

                try {
                    if (alreadyIn) {
                        await wishlistApi.removeFromWishlist(token, productId);
                    } else {
                        await wishlistApi.addToWishlist(token, productId);
                    }
                } catch {
                    // Revert on failure
                    setApiIds(apiIds);
                }
            } else {
                // Anonymous: use localStorage
                setLocalIds(prev => {
                    const updated = prev.includes(productId)
                        ? prev.filter(id => id !== productId)
                        : [...prev, productId];
                    saveLocalWishlist(updated);
                    return updated;
                });
            }
        },
        [isAuthenticated, token, apiIds]
    );

    const syncWithApi = useCallback(async (authToken: string) => {
        setToken(authToken);
        const localWishlist = getLocalWishlist();
        try {
            // Bulk sync local items to API, then fetch updated list
            const items = await wishlistApi.bulkSyncWishlist(authToken, localWishlist);
            setApiIds(items.map(item => item.productId));
            // Clear localStorage after successful sync
            saveLocalWishlist([]);
            setLocalIds([]);
        } catch {
            // API unavailable - keep local data
            const items = await wishlistApi.getWishlist(authToken).catch(() => []);
            setApiIds(items.map(item => item.productId));
        }
    }, []);

    const clearLocalWishlist = useCallback(() => {
        saveLocalWishlist([]);
        setLocalIds([]);
        setToken(null);
        setApiIds([]);
    }, []);

    return (
        <WishlistContext.Provider
            value={{
                wishlistIds,
                isInWishlist,
                toggleWishlist,
                syncWithApi,
                clearLocalWishlist,
                wishlistCount: wishlistIds.length
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
