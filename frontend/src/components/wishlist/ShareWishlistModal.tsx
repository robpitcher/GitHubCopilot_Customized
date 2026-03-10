import { useState } from 'react';
import { QRCodeSVG as QRCode } from 'qrcode.react';
import { WishlistShare } from '../../context/WishlistContext';
import { useTheme } from '../../context/ThemeContext';
import { api } from '../../api/config';
import axios from 'axios';

interface ShareWishlistModalProps {
    onClose: () => void;
    onShare: (options?: { isPublic?: boolean; expiresAt?: string }) => Promise<WishlistShare>;
}

function getAuthHeader(): Record<string, string> {
    const token = localStorage.getItem('authToken');
    return token ? { Authorization: `Bearer ${token}` } : {};
}

export default function ShareWishlistModal({ onClose, onShare }: ShareWishlistModalProps) {
    const { darkMode } = useTheme();
    const [share, setShare] = useState<WishlistShare | null>(null);
    const [isPublic, setIsPublic] = useState(true);
    const [expiresAt, setExpiresAt] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [copied, setCopied] = useState(false);

    const shareUrl = share
        ? `${window.location.origin}/wishlist/shared/${share.shareToken}`
        : '';

    const handleCreate = async () => {
        setLoading(true);
        setError('');
        try {
            const result = await onShare({ isPublic, expiresAt: expiresAt || undefined });
            setShare(result);
        } catch (err) {
            if (axios.isAxiosError(err)) {
                setError(err.response?.data?.error ?? 'Failed to create share link');
            } else {
                setError('Failed to create share link');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(shareUrl);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch {
            // Fallback for environments without clipboard API
            const el = document.createElement('textarea');
            el.value = shareUrl;
            document.body.appendChild(el);
            el.select();
            document.execCommand('copy');
            document.body.removeChild(el);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const handleRevoke = async () => {
        if (!share) return;
        setLoading(true);
        try {
            await axios.delete(`${api.baseURL}${api.endpoints.wishlist}/share/${share.shareId}`, {
                headers: getAuthHeader()
            });
            setShare(null);
        } catch {
            setError('Failed to revoke share link');
        } finally {
            setLoading(false);
        }
    };

    const minDate = new Date();
    minDate.setDate(minDate.getDate() + 1);
    const minDateStr = minDate.toISOString().split('T')[0];

    return (
        <div
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
            onClick={onClose}
            role="dialog"
            aria-modal="true"
            aria-labelledby="share-modal-title"
        >
            <div
                className={`${darkMode ? 'bg-gray-800 text-light' : 'bg-white text-gray-800'} rounded-lg p-6 max-w-md w-full shadow-xl transition-colors`}
                onClick={e => e.stopPropagation()}
            >
                <div className="flex justify-between items-center mb-4">
                    <h2 id="share-modal-title" className="text-xl font-bold">Share Your Wishlist</h2>
                    <button
                        onClick={onClose}
                        className={`${darkMode ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-black'} transition-colors`}
                        aria-label="Close modal"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {error && (
                    <div className="bg-red-100 text-red-700 rounded p-2 mb-4 text-sm">{error}</div>
                )}

                {!share ? (
                    <div className="space-y-4">
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={isPublic}
                                onChange={e => setIsPublic(e.target.checked)}
                                className="accent-primary"
                                aria-label="Make wishlist public"
                            />
                            <span className="text-sm">Make wishlist publicly viewable</span>
                        </label>

                        <div>
                            <label htmlFor="expires-at" className={`block text-sm mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                                Expiration date (optional)
                            </label>
                            <input
                                id="expires-at"
                                type="date"
                                min={minDateStr}
                                value={expiresAt}
                                onChange={e => setExpiresAt(e.target.value)}
                                className={`w-full rounded px-3 py-2 text-sm border ${darkMode ? 'bg-gray-700 border-gray-600 text-light' : 'bg-gray-50 border-gray-300 text-gray-800'} focus:outline-none focus:border-primary`}
                            />
                        </div>

                        <button
                            onClick={handleCreate}
                            disabled={loading}
                            className="w-full bg-primary hover:bg-accent text-white py-2 rounded-lg transition-colors disabled:opacity-50"
                            aria-label="Generate share link"
                        >
                            {loading ? 'Generating...' : 'Generate Share Link'}
                        </button>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {/* QR Code */}
                        <div className="flex justify-center">
                            <div className="bg-white p-3 rounded-lg">
                                <QRCode value={shareUrl} size={160} aria-label="QR code for share link" />
                            </div>
                        </div>

                        {/* Share URL */}
                        <div className={`rounded-lg p-3 text-sm break-all ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                            {shareUrl}
                        </div>

                        {/* View count */}
                        <p className={`text-sm text-center ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                            👀 Viewed {share.viewCount} {share.viewCount === 1 ? 'time' : 'times'}
                            {share.expiresAt && ` · Expires ${new Date(share.expiresAt).toLocaleDateString()}`}
                        </p>

                        <div className="flex gap-2">
                            <button
                                onClick={handleCopy}
                                className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                                    copied
                                        ? 'bg-green-500 text-white'
                                        : 'bg-primary hover:bg-accent text-white'
                                }`}
                                aria-label="Copy share link to clipboard"
                            >
                                {copied ? '✓ Copied!' : 'Copy Link'}
                            </button>
                            <button
                                onClick={handleRevoke}
                                disabled={loading}
                                className={`px-4 py-2 rounded-lg text-sm transition-colors disabled:opacity-50 ${darkMode ? 'bg-gray-700 text-red-400 hover:bg-red-900/30' : 'bg-gray-100 text-red-500 hover:bg-red-50'}`}
                                aria-label="Revoke share link"
                            >
                                Revoke
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
