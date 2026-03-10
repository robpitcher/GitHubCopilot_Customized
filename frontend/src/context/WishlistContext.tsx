import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import axios from 'axios';
import { api } from '../api/config';

export interface WishlistItem {
    wishlistId: number;
    userId: number;
    productId: number;
    addedAt: string;
    priority: 'low' | 'medium' | 'high';
    notes?: string;
    priceWhenAdded: number;
    notifyOnPriceDrop: boolean;
    notifyOnStock: boolean;
    product?: {
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

export interface Notification {
    notificationId: number;
    userId: number;
    type: 'price_drop' | 'stock_alert' | 'recommendation';
    productId: number;
    message: string;
    read: boolean;
    createdAt: string;
}

export interface WishlistShare {
    shareId: number;
    wishlistId: number;
    userId: number;
    shareToken: string;
    isPublic: boolean;
    expiresAt?: string;
    viewCount: number;
    createdAt: string;
}

interface WishlistContextType {
    items: WishlistItem[];
    notifications: Notification[];
    unreadCount: number;
    isLoading: boolean;
    fetchWishlist: () => Promise<void>;
    addItem: (productId: number, options?: {
        priority?: 'low' | 'medium' | 'high';
        notes?: string;
        notifyOnPriceDrop?: boolean;
        notifyOnStock?: boolean;
    }) => Promise<void>;
    updateItem: (productId: number, updates: Partial<WishlistItem>) => Promise<void>;
    removeItem: (productId: number) => Promise<void>;
    bulkAdd: (items: Array<{ productId: number; priority?: 'low' | 'medium' | 'high' }>) => Promise<void>;
    fetchNotifications: () => Promise<void>;
    markNotificationRead: (id: number) => Promise<void>;
    deleteNotification: (id: number) => Promise<void>;
    shareWishlist: (options?: { isPublic?: boolean; expiresAt?: string }) => Promise<WishlistShare>;
    fetchRecommendations: () => Promise<void>;
    recommendations: WishlistItem['product'][];
}

const WishlistContext = createContext<WishlistContextType | null>(null);

const POLL_INTERVAL = 30_000; // 30 seconds - periodic polling interval for new notifications

function getAuthHeader(): { Authorization: string } | Record<string, never> {
    const token = localStorage.getItem('authToken');
    return token ? { Authorization: `Bearer ${token}` } : {};
}

export function WishlistProvider({ children }: { children: ReactNode }) {
    const [items, setItems] = useState<WishlistItem[]>([]);
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [recommendations, setRecommendations] = useState<WishlistItem['product'][]>([]);
    const [isLoading, setIsLoading] = useState(false);

    const unreadCount = notifications.filter(n => !n.read).length;

    const fetchWishlist = useCallback(async () => {
        try {
            const { data } = await axios.get(`${api.baseURL}${api.endpoints.wishlist}`, {
                headers: getAuthHeader()
            });
            setItems(data);
        } catch {
            // Silently fail if not authenticated
        }
    }, []);

    const fetchNotifications = useCallback(async () => {
        try {
            const { data } = await axios.get(`${api.baseURL}${api.endpoints.notifications}`, {
                headers: getAuthHeader()
            });
            setNotifications(data);
        } catch {
            // Silently fail
        }
    }, []);

    const fetchRecommendations = useCallback(async () => {
        try {
            const { data } = await axios.get(`${api.baseURL}${api.endpoints.wishlist}/recommendations`, {
                headers: getAuthHeader()
            });
            setRecommendations(data);
        } catch {
            // Silently fail
        }
    }, []);

    const addItem = useCallback(async (
        productId: number,
        options?: {
            priority?: 'low' | 'medium' | 'high';
            notes?: string;
            notifyOnPriceDrop?: boolean;
            notifyOnStock?: boolean;
        }
    ) => {
        const { data } = await axios.post(
            `${api.baseURL}${api.endpoints.wishlist}`,
            { productId, ...options },
            { headers: getAuthHeader() }
        );
        setItems(prev => [...prev, data]);
    }, []);

    const updateItem = useCallback(async (productId: number, updates: Partial<WishlistItem>) => {
        const { data } = await axios.put(
            `${api.baseURL}${api.endpoints.wishlist}/${productId}`,
            updates,
            { headers: getAuthHeader() }
        );
        setItems(prev => prev.map(item => item.productId === productId ? data : item));
    }, []);

    const removeItem = useCallback(async (productId: number) => {
        await axios.delete(`${api.baseURL}${api.endpoints.wishlist}/${productId}`, {
            headers: getAuthHeader()
        });
        setItems(prev => prev.filter(item => item.productId !== productId));
    }, []);

    const bulkAdd = useCallback(async (
        bulkItems: Array<{ productId: number; priority?: 'low' | 'medium' | 'high' }>
    ) => {
        const { data } = await axios.post(
            `${api.baseURL}${api.endpoints.wishlist}/bulk`,
            bulkItems,
            { headers: getAuthHeader() }
        );
        setItems(prev => [...prev, ...data.added]);
    }, []);

    const markNotificationRead = useCallback(async (id: number) => {
        const { data } = await axios.put(
            `${api.baseURL}${api.endpoints.notifications}/${id}/read`,
            {},
            { headers: getAuthHeader() }
        );
        setNotifications(prev => prev.map(n => n.notificationId === id ? data : n));
    }, []);

    const deleteNotification = useCallback(async (id: number) => {
        await axios.delete(`${api.baseURL}${api.endpoints.notifications}/${id}`, {
            headers: getAuthHeader()
        });
        setNotifications(prev => prev.filter(n => n.notificationId !== id));
    }, []);

    const shareWishlist = useCallback(async (options?: { isPublic?: boolean; expiresAt?: string }) => {
        const { data } = await axios.post(
            `${api.baseURL}${api.endpoints.wishlist}/share`,
            options ?? { isPublic: true },
            { headers: getAuthHeader() }
        );
        return data as WishlistShare;
    }, []);

    // Initial load
    useEffect(() => {
        const token = localStorage.getItem('authToken');
        if (token) {
            setIsLoading(true);
            Promise.all([fetchWishlist(), fetchNotifications()])
                .finally(() => setIsLoading(false));
        }
    }, [fetchWishlist, fetchNotifications]);

    // Periodic notification polling every 30 seconds
    useEffect(() => {
        const interval = setInterval(() => {
            const token = localStorage.getItem('authToken');
            if (token) {
                fetchNotifications();
            }
        }, POLL_INTERVAL);
        return () => clearInterval(interval);
    }, [fetchNotifications]);

    return (
        <WishlistContext.Provider value={{
            items,
            notifications,
            unreadCount,
            isLoading,
            fetchWishlist,
            addItem,
            updateItem,
            removeItem,
            bulkAdd,
            fetchNotifications,
            markNotificationRead,
            deleteNotification,
            shareWishlist,
            fetchRecommendations,
            recommendations
        }}>
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
