import { WishlistItem } from '../models/wishlist';
import { Notification } from '../models/notification';
import { User } from '../models/user';
import { Product } from '../models/product';
import { sendPriceDropEmail } from './email';

/**
 * Price monitoring service.
 * Checks for price changes and creates notifications when price drops >= 5%.
 * Runs periodically using setTimeout for demo purposes.
 */

// These references are injected via init() to avoid circular imports
let getWishlistItems: () => WishlistItem[];
let getProducts: () => Product[];
let getUsers: () => User[];
let addNotification: (notification: Notification) => void;
let getNotifications: () => Notification[];
let nextNotificationId: () => number;

const PRICE_DROP_THRESHOLD = 5; // percent
const CHECK_INTERVAL_MS = 60 * 60 * 1000; // 1 hour (simulated)
let monitorInterval: ReturnType<typeof setTimeout> | null = null;

export function initPriceMonitor(deps: {
    getWishlistItems: () => WishlistItem[];
    getProducts: () => Product[];
    getUsers: () => User[];
    addNotification: (n: Notification) => void;
    getNotifications: () => Notification[];
    nextNotificationId: () => number;
}): void {
    getWishlistItems = deps.getWishlistItems;
    getProducts = deps.getProducts;
    getUsers = deps.getUsers;
    addNotification = deps.addNotification;
    getNotifications = deps.getNotifications;
    nextNotificationId = deps.nextNotificationId;
}

export function monitorPrices(): void {
    if (!getWishlistItems || !getProducts || !getUsers) return;

    const wishlistItems = getWishlistItems();
    const products = getProducts();
    const users = getUsers();

    wishlistItems.forEach(item => {
        if (!item.notifyOnPriceDrop) return;

        const product = products.find(p => p.productId === item.productId);
        if (!product) return;

        const currentPrice = product.discount
            ? product.price * (1 - product.discount)
            : product.price;

        if (item.priceWhenAdded <= 0) return;

        const priceDrop = ((item.priceWhenAdded - currentPrice) / item.priceWhenAdded) * 100;

        if (priceDrop < PRICE_DROP_THRESHOLD) return;

        // Avoid duplicate notifications: check if one already exists for this user+product combo today
        const today = new Date().toISOString().split('T')[0];
        const alreadyNotified = getNotifications().some(
            n =>
                n.userId === item.userId &&
                n.productId === item.productId &&
                n.type === 'price_drop' &&
                n.createdAt.startsWith(today)
        );
        if (alreadyNotified) return;

        const notification: Notification = {
            notificationId: nextNotificationId(),
            userId: item.userId,
            type: 'price_drop',
            productId: item.productId,
            message: `Price dropped ${priceDrop.toFixed(0)}% on ${product.name}! Now $${currentPrice.toFixed(2)} (was $${item.priceWhenAdded.toFixed(2)})`,
            read: false,
            createdAt: new Date().toISOString()
        };
        addNotification(notification);

        const user = users.find(u => u.userId === item.userId);
        if (user?.notificationPreferences?.email && user.notificationPreferences.priceAlerts) {
            sendPriceDropEmail(user.email, {
                productName: product.name,
                originalPrice: item.priceWhenAdded,
                currentPrice,
                priceDrop
            });
        }
    });

    console.log('[PriceMonitor] Price check complete.');
}

export function startPriceMonitor(): void {
    // Run immediately then schedule
    monitorPrices();

    const schedule = () => {
        monitorInterval = setTimeout(() => {
            monitorPrices();
            schedule();
        }, CHECK_INTERVAL_MS);
    };
    schedule();
    console.log(`[PriceMonitor] Started. Checking every ${CHECK_INTERVAL_MS / 1000 / 60} minutes.`);
}

export function stopPriceMonitor(): void {
    if (monitorInterval !== null) {
        clearTimeout(monitorInterval);
        monitorInterval = null;
    }
}
