import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useWishlist, Notification } from '../context/WishlistContext';
import { useTheme } from '../context/ThemeContext';

const TYPE_ICONS: Record<Notification['type'], string> = {
    price_drop: '💰',
    stock_alert: '📦',
    recommendation: '🤖'
};

export default function Notifications() {
    const { notifications, unreadCount, markNotificationRead, deleteNotification } = useWishlist();
    const { darkMode } = useTheme();
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    // Close dropdown on outside click
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) {
                setOpen(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const recent = notifications.slice(0, 8);

    const handleClick = async (notif: Notification) => {
        if (!notif.read) {
            await markNotificationRead(notif.notificationId);
        }
    };

    return (
        <div className="relative" ref={ref}>
            {/* Bell button */}
            <button
                onClick={() => setOpen(prev => !prev)}
                className={`relative p-2 rounded-full transition-colors ${darkMode ? 'text-light hover:text-primary' : 'text-gray-700 hover:text-primary'}`}
                aria-label={`Notifications${unreadCount > 0 ? `, ${unreadCount} unread` : ''}`}
                aria-haspopup="true"
                aria-expanded={open}
            >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                {unreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-xs font-bold w-4 h-4 flex items-center justify-center rounded-full" aria-hidden="true">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>

            {/* Dropdown panel */}
            {open && (
                <div
                    className={`absolute right-0 mt-2 w-80 rounded-lg shadow-xl z-50 overflow-hidden ${darkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'}`}
                    role="menu"
                    aria-label="Notifications"
                >
                    <div className={`flex items-center justify-between px-4 py-3 border-b ${darkMode ? 'border-gray-700' : 'border-gray-100'}`}>
                        <h3 className={`font-semibold text-sm ${darkMode ? 'text-light' : 'text-gray-800'}`}>Notifications</h3>
                        {unreadCount > 0 && (
                            <span className="text-xs text-primary">{unreadCount} unread</span>
                        )}
                    </div>

                    {recent.length === 0 ? (
                        <div className={`px-4 py-6 text-center text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                            No notifications yet
                        </div>
                    ) : (
                        <ul className="max-h-72 overflow-y-auto">
                            {recent.map(notif => (
                                <li
                                    key={notif.notificationId}
                                    className={`px-4 py-3 border-b last:border-b-0 transition-colors cursor-pointer ${
                                        !notif.read
                                            ? (darkMode ? 'bg-gray-700/50' : 'bg-blue-50')
                                            : (darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-50')
                                    } ${darkMode ? 'border-gray-700' : 'border-gray-100'}`}
                                    onClick={() => handleClick(notif)}
                                    role="menuitem"
                                >
                                    <div className="flex items-start gap-2">
                                        <span className="text-base" aria-hidden="true">{TYPE_ICONS[notif.type]}</span>
                                        <div className="flex-1 min-w-0">
                                            <p className={`text-sm ${darkMode ? 'text-light' : 'text-gray-800'} ${!notif.read ? 'font-medium' : ''} leading-tight`}>
                                                {notif.message}
                                            </p>
                                            <p className={`text-xs mt-0.5 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                                {new Date(notif.createdAt).toLocaleString()}
                                            </p>
                                        </div>
                                        <button
                                            onClick={e => { e.stopPropagation(); deleteNotification(notif.notificationId); }}
                                            className={`text-xs px-1.5 py-0.5 rounded transition-colors ${darkMode ? 'text-gray-500 hover:text-red-400' : 'text-gray-400 hover:text-red-500'}`}
                                            aria-label="Delete notification"
                                        >
                                            ×
                                        </button>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}

                    <div className={`px-4 py-2 border-t ${darkMode ? 'border-gray-700' : 'border-gray-100'}`}>
                        <Link
                            to="/notifications"
                            className="text-xs text-primary hover:underline block text-center"
                            onClick={() => setOpen(false)}
                        >
                            View all notifications →
                        </Link>
                    </div>
                </div>
            )}
        </div>
    );
}
