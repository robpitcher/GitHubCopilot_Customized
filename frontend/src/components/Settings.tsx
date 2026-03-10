import { useState } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { api } from '../api/config';
import { toast, Toaster } from 'react-hot-toast';
import { useWishlist } from '../context/WishlistContext';

interface NotificationPreferences {
    email: boolean;
    push: boolean;
    priceAlerts: boolean;
    stockAlerts: boolean;
}

function getAuthHeader(): Record<string, string> {
    const token = localStorage.getItem('authToken');
    return token ? { Authorization: `Bearer ${token}` } : {};
}

export default function Settings() {
    const { isLoggedIn } = useAuth();
    const { darkMode } = useTheme();
    const { items } = useWishlist();
    const [prefs, setPrefs] = useState<NotificationPreferences>({
        email: true,
        push: true,
        priceAlerts: true,
        stockAlerts: true
    });
    const [saving, setSaving] = useState(false);

    if (!isLoggedIn) {
        return (
            <div className={`min-h-screen ${darkMode ? 'bg-dark' : 'bg-gray-100'} pt-20 px-4 flex items-center justify-center`}>
                <div className={`text-center ${darkMode ? 'text-light' : 'text-gray-700'}`}>
                    <p className="mb-4">Please log in to access settings.</p>
                    <a href="/login" className="bg-primary hover:bg-accent text-white px-6 py-2 rounded-lg transition-colors inline-block">
                        Log In
                    </a>
                </div>
            </div>
        );
    }

    const handleSave = async () => {
        setSaving(true);
        try {
            await axios.put(`${api.baseURL}${api.endpoints.auth}/preferences`, prefs, {
                headers: getAuthHeader()
            });
            toast.success('Settings saved');
        } catch {
            toast.error('Failed to save settings');
        } finally {
            setSaving(false);
        }
    };

    const handleExportData = () => {
        const data = {
            exportedAt: new Date().toISOString(),
            notificationPreferences: prefs,
            wishlistItemCount: items.length,
            wishlistItems: items.map(item => ({
                product: item.product?.name,
                priority: item.priority,
                notes: item.notes,
                addedAt: item.addedAt
            }))
        };
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'my-data.json';
        a.click();
        URL.revokeObjectURL(url);
    };

    const cardClass = `${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg p-6 shadow transition-colors`;
    const labelClass = `${darkMode ? 'text-light' : 'text-gray-800'} font-medium text-sm`;
    const descClass = `${darkMode ? 'text-gray-400' : 'text-gray-500'} text-xs mt-0.5`;

    return (
        <div className={`min-h-screen ${darkMode ? 'bg-dark' : 'bg-gray-100'} pt-20 pb-16 px-4 transition-colors`}>
            <Toaster position="top-right" />
            <div className="max-w-2xl mx-auto">
                <h1 className={`text-3xl font-bold mb-6 ${darkMode ? 'text-light' : 'text-gray-800'}`}>Settings</h1>

                {/* Notification Preferences */}
                <div className={`${cardClass} mb-6`}>
                    <h2 className={`text-lg font-semibold mb-4 ${darkMode ? 'text-light' : 'text-gray-800'}`}>
                        🔔 Notification Preferences
                    </h2>
                    <div className="space-y-4">
                        {[
                            { key: 'email' as const, label: 'Email Notifications', desc: 'Receive notifications via email' },
                            { key: 'push' as const, label: 'Push Notifications', desc: 'Receive in-app push notifications' },
                            { key: 'priceAlerts' as const, label: 'Price Drop Alerts', desc: 'Get notified when wishlist items go on sale' },
                            { key: 'stockAlerts' as const, label: 'Stock Alerts', desc: 'Get notified when out-of-stock items are available' }
                        ].map(({ key, label, desc }) => (
                            <label key={key} className="flex items-center justify-between cursor-pointer">
                                <div>
                                    <p className={labelClass}>{label}</p>
                                    <p className={descClass}>{desc}</p>
                                </div>
                                <div className="relative">
                                    <input
                                        type="checkbox"
                                        checked={prefs[key]}
                                        onChange={e => setPrefs(prev => ({ ...prev, [key]: e.target.checked }))}
                                        className="sr-only"
                                        id={`toggle-${key}`}
                                        aria-label={label}
                                    />
                                    <div
                                        className={`w-11 h-6 rounded-full transition-colors ${prefs[key] ? 'bg-primary' : (darkMode ? 'bg-gray-600' : 'bg-gray-300')}`}
                                        onClick={() => setPrefs(prev => ({ ...prev, [key]: !prev[key] }))}
                                        role="switch"
                                        aria-checked={prefs[key]}
                                        tabIndex={0}
                                        onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') setPrefs(prev => ({ ...prev, [key]: !prev[key] })); }}
                                    >
                                        <div className={`w-5 h-5 bg-white rounded-full shadow m-0.5 transition-transform ${prefs[key] ? 'translate-x-5' : 'translate-x-0'}`} />
                                    </div>
                                </div>
                            </label>
                        ))}
                    </div>
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="mt-6 w-full bg-primary hover:bg-accent text-white py-2 rounded-lg transition-colors disabled:opacity-50"
                        aria-label="Save notification preferences"
                    >
                        {saving ? 'Saving...' : 'Save Preferences'}
                    </button>
                </div>

                {/* Privacy Settings */}
                <div className={`${cardClass} mb-6`}>
                    <h2 className={`text-lg font-semibold mb-4 ${darkMode ? 'text-light' : 'text-gray-800'}`}>
                        🔒 Privacy Settings
                    </h2>
                    <div className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'} space-y-2`}>
                        <p>• Shared wishlist links include your display name by default.</p>
                        <p>• You can revoke any share link at any time from the Wishlist page.</p>
                        <p>• Share links can be set to expire after a chosen date.</p>
                        <p>• Maximum of 5 active share links per account.</p>
                    </div>
                </div>

                {/* Data Export */}
                <div className={cardClass}>
                    <h2 className={`text-lg font-semibold mb-4 ${darkMode ? 'text-light' : 'text-gray-800'}`}>
                        📥 Export Data
                    </h2>
                    <p className={`text-sm mb-4 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                        Download a copy of your wishlist and preferences as JSON.
                    </p>
                    <button
                        onClick={handleExportData}
                        className={`px-4 py-2 rounded-lg text-sm transition-colors ${darkMode ? 'bg-gray-700 text-light hover:bg-gray-600' : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-200'}`}
                        aria-label="Download your data"
                    >
                        Download My Data
                    </button>
                </div>
            </div>
        </div>
    );
}
