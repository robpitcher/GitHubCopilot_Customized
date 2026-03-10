import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useWishlist, Notification } from '../context/WishlistContext';
import { useTheme } from '../context/ThemeContext';
import { toast, Toaster } from 'react-hot-toast';

type FilterType = 'all' | Notification['type'];

const TYPE_ICONS: Record<Notification['type'], string> = {
    price_drop: '💰',
    stock_alert: '📦',
    recommendation: '🤖'
};

const TYPE_LABELS: Record<Notification['type'], string> = {
    price_drop: 'Price Drops',
    stock_alert: 'Stock Alerts',
    recommendation: 'Recommendations'
};

export default function NotificationPanel() {
    const { notifications, markNotificationRead, deleteNotification, fetchNotifications } = useWishlist();
    const { darkMode } = useTheme();
    const [filter, setFilter] = useState<FilterType>('all');

    const filtered = notifications.filter(n => filter === 'all' || n.type === filter);

    const grouped: Record<string, Notification[]> = {};
    filtered.forEach(n => {
        const date = new Date(n.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
        if (!grouped[date]) grouped[date] = [];
        grouped[date].push(n);
    });

    const handleMarkAllRead = async () => {
        const unread = filtered.filter(n => !n.read);
        await Promise.all(unread.map(n => markNotificationRead(n.notificationId)));
        toast.success(`Marked ${unread.length} as read`);
    };

    const handleClearAll = async () => {
        if (!window.confirm('Delete all displayed notifications?')) return;
        await Promise.all(filtered.map(n => deleteNotification(n.notificationId)));
        toast.success('Notifications cleared');
    };

    return (
        <div className={`min-h-screen ${darkMode ? 'bg-dark' : 'bg-gray-100'} pt-20 pb-16 px-4 transition-colors`}>
            <Toaster position="top-right" />
            <div className="max-w-3xl mx-auto">
                {/* Header */}
                <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
                    <h1 className={`text-3xl font-bold ${darkMode ? 'text-light' : 'text-gray-800'}`}>
                        Notifications
                    </h1>
                    <div className="flex gap-2">
                        <button
                            onClick={() => fetchNotifications()}
                            className={`p-2 rounded-lg transition-colors ${darkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-white text-gray-500 hover:bg-gray-50 border border-gray-200'}`}
                            aria-label="Refresh notifications"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                        </button>
                        {filtered.some(n => !n.read) && (
                            <button
                                onClick={handleMarkAllRead}
                                className={`text-sm px-3 py-2 rounded-lg transition-colors ${darkMode ? 'bg-gray-700 text-primary hover:bg-gray-600' : 'bg-white text-primary hover:bg-gray-50 border border-gray-200'}`}
                                aria-label="Mark all as read"
                            >
                                Mark all read
                            </button>
                        )}
                        {filtered.length > 0 && (
                            <button
                                onClick={handleClearAll}
                                className={`text-sm px-3 py-2 rounded-lg transition-colors ${darkMode ? 'bg-gray-700 text-red-400 hover:bg-red-900/20' : 'bg-white text-red-500 hover:bg-red-50 border border-gray-200'}`}
                                aria-label="Clear all notifications"
                            >
                                Clear all
                            </button>
                        )}
                    </div>
                </div>

                {/* Filter tabs */}
                <div className={`flex gap-1 p-1 rounded-lg mb-6 ${darkMode ? 'bg-gray-800' : 'bg-white border border-gray-200'}`}>
                    {(['all', 'price_drop', 'stock_alert', 'recommendation'] as FilterType[]).map(type => (
                        <button
                            key={type}
                            onClick={() => setFilter(type)}
                            className={`flex-1 text-xs py-2 px-3 rounded-md capitalize transition-colors ${
                                filter === type
                                    ? 'bg-primary text-white'
                                    : `${darkMode ? 'text-gray-400 hover:bg-gray-700' : 'text-gray-500 hover:bg-gray-100'}`
                            }`}
                            aria-pressed={filter === type}
                            aria-label={`Filter by ${type === 'all' ? 'all types' : TYPE_LABELS[type as Notification['type']]}`}
                        >
                            {type === 'all' ? 'All' : TYPE_LABELS[type as Notification['type']]}
                        </button>
                    ))}
                </div>

                {/* Notification list grouped by date */}
                {Object.keys(grouped).length === 0 ? (
                    <div className={`text-center py-16 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                        <div className="text-5xl mb-4">🔔</div>
                        <p className="text-xl">No notifications</p>
                        <p className="text-sm mt-2">
                            {filter === 'all'
                                ? 'You\'re all caught up!'
                                : `No ${TYPE_LABELS[filter as Notification['type']].toLowerCase()} yet.`}
                        </p>
                    </div>
                ) : (
                    Object.entries(grouped).map(([date, notifs]) => (
                        <div key={date} className="mb-6">
                            <h2 className={`text-xs font-semibold uppercase tracking-wide mb-2 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                                {date}
                            </h2>
                            <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg overflow-hidden shadow transition-colors`}>
                                {notifs.map((notif, idx) => (
                                    <div
                                        key={notif.notificationId}
                                        className={`flex items-start gap-3 px-4 py-3 transition-colors ${
                                            idx < notifs.length - 1
                                                ? `border-b ${darkMode ? 'border-gray-700' : 'border-gray-100'}`
                                                : ''
                                        } ${!notif.read ? (darkMode ? 'bg-gray-700/40' : 'bg-blue-50/50') : ''}`}
                                    >
                                        <span className="text-xl mt-0.5" aria-hidden="true">{TYPE_ICONS[notif.type]}</span>
                                        <div className="flex-1 min-w-0">
                                            <p className={`text-sm ${darkMode ? 'text-light' : 'text-gray-800'} ${!notif.read ? 'font-medium' : ''}`}>
                                                {notif.message}
                                            </p>
                                            <div className="flex items-center gap-3 mt-1">
                                                <span className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                                                    {new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                                <span className={`text-xs px-2 py-0.5 rounded-full capitalize ${
                                                    notif.type === 'price_drop' ? 'bg-green-100 text-green-700' :
                                                    notif.type === 'stock_alert' ? 'bg-blue-100 text-blue-700' :
                                                    'bg-purple-100 text-purple-700'
                                                }`}>
                                                    {TYPE_LABELS[notif.type]}
                                                </span>
                                                {!notif.read && (
                                                    <button
                                                        onClick={() => markNotificationRead(notif.notificationId)}
                                                        className="text-xs text-primary hover:underline"
                                                        aria-label="Mark as read"
                                                    >
                                                        Mark read
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => deleteNotification(notif.notificationId)}
                                            className={`p-1 rounded transition-colors ${darkMode ? 'text-gray-500 hover:text-red-400' : 'text-gray-400 hover:text-red-500'}`}
                                            aria-label="Delete notification"
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                            </svg>
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))
                )}

                <div className="text-center mt-4">
                    <Link to="/settings" className="text-sm text-primary hover:underline">
                        Manage notification settings →
                    </Link>
                </div>
            </div>
        </div>
    );
}
