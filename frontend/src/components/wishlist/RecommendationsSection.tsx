import { useEffect } from 'react';
import { useWishlist } from '../../context/WishlistContext';
import { useTheme } from '../../context/ThemeContext';

interface RecommendationsSectionProps {
    onAddToWishlist: (productId: number) => void;
}

export default function RecommendationsSection({ onAddToWishlist }: RecommendationsSectionProps) {
    const { recommendations, fetchRecommendations, items } = useWishlist();
    const { darkMode } = useTheme();

    // Lazy load on mount
    useEffect(() => {
        fetchRecommendations();
    }, [fetchRecommendations]);

    if (recommendations.length === 0) return null;

    const wishlistProductIds = new Set(items.map(i => i.productId));

    return (
        <section aria-labelledby="recommendations-heading" className="mt-10">
            <div className="flex items-center gap-2 mb-4">
                <span className="text-2xl">🤖</span>
                <h2 id="recommendations-heading" className={`text-xl font-bold ${darkMode ? 'text-light' : 'text-gray-800'}`}>
                    Based on Your Wishlist
                </h2>
            </div>
            <p className={`text-sm mb-4 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                AI-powered recommendations tailored to your tastes
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {recommendations.map((product: any) => (
                    <div
                        key={product.productId}
                        className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg overflow-hidden shadow flex flex-col transition-all duration-300 hover:shadow-lg hover:scale-105`}
                    >
                        <div className={`relative h-36 ${darkMode ? 'bg-gray-700' : 'bg-gray-100'} flex items-center justify-center`}>
                            <img
                                src={`/${product.imgName}`}
                                alt={product.name}
                                className="h-full w-full object-contain p-2"
                            />
                            {product.discount && (
                                <span className="absolute top-1 right-1 bg-primary text-white text-xs px-1.5 py-0.5 rounded-full">
                                    {Math.round(product.discount * 100)}% OFF
                                </span>
                            )}
                        </div>
                        <div className="p-3 flex flex-col flex-grow">
                            <h3 className={`text-sm font-semibold line-clamp-2 mb-1 ${darkMode ? 'text-light' : 'text-gray-800'}`}>
                                {product.name}
                            </h3>
                            <p className={`text-xs mb-2 ${darkMode ? 'text-gray-400' : 'text-gray-500'} line-clamp-2 flex-grow`}>
                                {product.recommendationReason}
                            </p>
                            <div className="flex items-center justify-between mt-auto">
                                <span className="text-primary font-bold text-sm">
                                    ${product.discount
                                        ? (product.price * (1 - product.discount)).toFixed(2)
                                        : product.price.toFixed(2)}
                                </span>
                                {!wishlistProductIds.has(product.productId) && (
                                    <button
                                        onClick={() => onAddToWishlist(product.productId)}
                                        className="text-xs bg-primary hover:bg-accent text-white px-2 py-1 rounded transition-colors"
                                        aria-label={`Add ${product.name} to wishlist`}
                                    >
                                        + Wishlist
                                    </button>
                                )}
                                {wishlistProductIds.has(product.productId) && (
                                    <span className="text-xs text-green-500 font-medium">✓ In wishlist</span>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </section>
    );
}
