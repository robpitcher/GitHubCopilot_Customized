import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { api } from '../api/config';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useWishlist } from '../context/WishlistContext';
import { toast, Toaster } from 'react-hot-toast';

interface PublicWishlistItem {
    wishlistId: number;
    productId: number;
    priority: 'low' | 'medium' | 'high';
    notes?: string;
    priceWhenAdded: number;
    product: {
        productId: number;
        name: string;
        description: string;
        price: number;
        imgName: string;
        discount?: number;
    } | null;
}

interface PublicWishlistData {
    ownerName: string;
    share: {
        viewCount: number;
        expiresAt?: string;
    };
    items: PublicWishlistItem[];
}

const PRIORITY_COLORS = {
    low: 'bg-blue-100 text-blue-800',
    medium: 'bg-yellow-100 text-yellow-800',
    high: 'bg-red-100 text-red-800'
};

export default function PublicWishlist() {
    const { token } = useParams<{ token: string }>();
    const { darkMode } = useTheme();
    const { isLoggedIn } = useAuth();
    const { addItem } = useWishlist();
    const [data, setData] = useState<PublicWishlistData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [addingIds, setAddingIds] = useState<Set<number>>(new Set());

    useEffect(() => {
        if (!token) {
            setError('Invalid share link');
            setLoading(false);
            return;
        }
        axios.get(`${api.baseURL}${api.endpoints.wishlist}/shared/${token}`)
            .then(res => setData(res.data))
            .catch(err => {
                if (axios.isAxiosError(err)) {
                    setError(err.response?.data?.error ?? 'Failed to load shared wishlist');
                } else {
                    setError('Failed to load shared wishlist');
                }
            })
            .finally(() => setLoading(false));
    }, [token]);

    const handleAddToOwnWishlist = async (productId: number) => {
        setAddingIds(prev => new Set(prev).add(productId));
        try {
            await addItem(productId);
            toast.success('Added to your wishlist!');
        } catch {
            toast.error('Could not add to wishlist');
        } finally {
            setAddingIds(prev => { const next = new Set(prev); next.delete(productId); return next; });
        }
    };

    if (loading) {
        return (
            <div className={`min-h-screen ${darkMode ? 'bg-dark' : 'bg-gray-100'} pt-20 flex items-center justify-center`}>
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className={`min-h-screen ${darkMode ? 'bg-dark' : 'bg-gray-100'} pt-20 px-4 flex items-center justify-center`}>
                <div className={`text-center ${darkMode ? 'text-light' : 'text-gray-700'}`}>
                    <div className="text-5xl mb-4">😿</div>
                    <h2 className="text-2xl font-bold mb-2">Wishlist Not Found</h2>
                    <p className="text-gray-500">{error}</p>
                </div>
            </div>
        );
    }

    if (!data) return null;

    return (
        <div className={`min-h-screen ${darkMode ? 'bg-dark' : 'bg-gray-100'} pt-20 pb-16 px-4 transition-colors`}>
            <Toaster position="top-right" />
            <div className="max-w-5xl mx-auto">
                {/* Header */}
                <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg p-6 mb-6 shadow transition-colors`}>
                    <div className="flex items-center gap-3">
                        <div className="bg-primary/10 p-3 rounded-full">
                            <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                            </svg>
                        </div>
                        <div>
                            <h1 className={`text-2xl font-bold ${darkMode ? 'text-light' : 'text-gray-800'}`}>
                                {data.ownerName}'s Wishlist
                            </h1>
                            <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                {data.items.length} {data.items.length === 1 ? 'item' : 'items'} · 👀 Viewed {data.share.viewCount} {data.share.viewCount === 1 ? 'time' : 'times'}
                                {data.share.expiresAt && ` · Expires ${new Date(data.share.expiresAt).toLocaleDateString()}`}
                            </p>
                        </div>
                    </div>
                    {!isLoggedIn && (
                        <div className={`mt-4 p-3 rounded-lg text-sm ${darkMode ? 'bg-gray-700 text-gray-300' : 'bg-blue-50 text-blue-700'}`}>
                            <a href="/login" className="font-medium underline">Log in</a> to add items from this wishlist to your own.
                        </div>
                    )}
                </div>

                {/* Items */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    {data.items.map(item => {
                        const product = item.product;
                        if (!product) return null;
                        const currentPrice = product.discount
                            ? product.price * (1 - product.discount)
                            : product.price;
                        return (
                            <div
                                key={item.wishlistId}
                                className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg overflow-hidden shadow flex flex-col transition-colors`}
                            >
                                <div className={`h-48 ${darkMode ? 'bg-gray-700' : 'bg-gray-100'} flex items-center justify-center relative`}>
                                    <img
                                        src={`/${product.imgName}`}
                                        alt={product.name}
                                        className="h-full w-full object-contain p-3"
                                    />
                                    {product.discount && (
                                        <span className="absolute top-2 left-2 bg-primary text-white text-xs px-2 py-0.5 rounded-full">
                                            {Math.round(product.discount * 100)}% OFF
                                        </span>
                                    )}
                                    <span className={`absolute top-2 right-2 text-xs px-2 py-0.5 rounded-full capitalize ${PRIORITY_COLORS[item.priority]}`}>
                                        {item.priority}
                                    </span>
                                </div>
                                <div className="p-4 flex flex-col flex-grow">
                                    <h3 className={`font-semibold mb-1 ${darkMode ? 'text-light' : 'text-gray-800'}`}>
                                        {product.name}
                                    </h3>
                                    <p className={`text-xs mb-3 flex-grow ${darkMode ? 'text-gray-400' : 'text-gray-500'} line-clamp-2`}>
                                        {product.description}
                                    </p>
                                    {item.notes && (
                                        <p className={`text-xs italic mb-3 ${darkMode ? 'text-gray-400' : 'text-gray-600'} border-l-2 border-primary pl-2`}>
                                            "{item.notes}"
                                        </p>
                                    )}
                                    <div className="flex items-center justify-between mt-auto">
                                        <span className="text-primary font-bold">${currentPrice.toFixed(2)}</span>
                                        {isLoggedIn && (
                                            <button
                                                onClick={() => handleAddToOwnWishlist(product.productId)}
                                                disabled={addingIds.has(product.productId)}
                                                className="text-sm bg-primary hover:bg-accent text-white px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
                                                aria-label={`Add ${product.name} to your wishlist`}
                                            >
                                                {addingIds.has(product.productId) ? 'Adding...' : '+ My Wishlist'}
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
