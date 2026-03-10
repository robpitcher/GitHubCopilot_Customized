/**
 * Shared in-memory data stores for the application.
 * Structured for easy migration to a real database.
 * Each array serves as an in-memory "table" with clear foreign-key relationships.
 */
import { User } from './models/user';
import { WishlistItem } from './models/wishlist';
import { WishlistShare } from './models/wishlistShare';
import { PriceHistory } from './models/priceHistory';
import { Notification } from './models/notification';
import {
    seedUsers,
    seedWishlistItems,
    seedWishlistShares,
    seedPriceHistory,
    seedNotifications
} from './seedData';

export let users: User[] = [...seedUsers];
export let wishlistItems: WishlistItem[] = [...seedWishlistItems];
export let wishlistShares: WishlistShare[] = [...seedWishlistShares];
export let priceHistory: PriceHistory[] = [...seedPriceHistory];
export let notifications: Notification[] = [...seedNotifications];

// Auto-increment ID counters
let _nextUserId = Math.max(0, ...users.map(u => u.userId)) + 1;
let _nextWishlistId = Math.max(0, ...wishlistItems.map(w => w.wishlistId)) + 1;
let _nextShareId = Math.max(0, ...wishlistShares.map(s => s.shareId)) + 1;
let _nextPriceHistoryId = Math.max(0, ...priceHistory.map(p => p.priceHistoryId)) + 1;
let _nextNotificationId = Math.max(0, ...notifications.map(n => n.notificationId)) + 1;

export const nextUserId = () => _nextUserId++;
export const nextWishlistId = () => _nextWishlistId++;
export const nextShareId = () => _nextShareId++;
export const nextPriceHistoryId = () => _nextPriceHistoryId++;
export const nextNotificationId = () => _nextNotificationId++;

// Reset helpers (used in tests)
export const resetStore = () => {
    users = [...seedUsers];
    wishlistItems = [...seedWishlistItems];
    wishlistShares = [...seedWishlistShares];
    priceHistory = [...seedPriceHistory];
    notifications = [...seedNotifications];
    _nextUserId = Math.max(0, ...users.map(u => u.userId)) + 1;
    _nextWishlistId = Math.max(0, ...wishlistItems.map(w => w.wishlistId)) + 1;
    _nextShareId = Math.max(0, ...wishlistShares.map(s => s.shareId)) + 1;
    _nextPriceHistoryId = Math.max(0, ...priceHistory.map(p => p.priceHistoryId)) + 1;
    _nextNotificationId = Math.max(0, ...notifications.map(n => n.notificationId)) + 1;
};
