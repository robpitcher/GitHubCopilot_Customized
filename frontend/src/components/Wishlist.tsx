import { useState } from 'react';
import { useTheme } from '../context/ThemeContext';
import { useWishlist, WishlistItem } from '../context/WishlistContext';
import { useAuth } from '../context/AuthContext';

type SortOption = 'recent' | 'priceDrop' | 'lowestPrice' | 'alphabetical';

export default function Wishlist() {
  const { darkMode } = useTheme();
  const { isLoggedIn } = useAuth();
  const { items, isLoading, error, removeFromWishlist } = useWishlist();
  const [sortBy, setSortBy] = useState<SortOption>('recent');

  const totalSavings = items.reduce((sum: number, item: WishlistItem) => {
    const drop = item.priceDrop ?? 0;
    return sum + (drop > 0 ? drop : 0);
  }, 0);

  const sortedItems = [...items].sort((a, b) => {
    switch (sortBy) {
      case 'priceDrop':
        return (b.priceDrop ?? 0) - (a.priceDrop ?? 0);
      case 'lowestPrice':
        return (a.currentPrice ?? a.priceAtTimeOfAdding) - (b.currentPrice ?? b.priceAtTimeOfAdding);
      case 'alphabetical':
        return (a.name ?? '').localeCompare(b.name ?? '');
      case 'recent':
      default:
        return new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime();
    }
  });

  if (!isLoggedIn) {
    return (
      <div className={`min-h-screen ${darkMode ? 'bg-dark' : 'bg-gray-100'} pt-20 pb-16 px-4 transition-colors duration-300`}>
        <div className="max-w-7xl mx-auto flex flex-col space-y-6">
          <h1 className={`text-3xl font-bold ${darkMode ? 'text-light' : 'text-gray-800'} transition-colors duration-300`}>
            My Wishlist
          </h1>
          {/* Login prompt banner */}
          <div className={`${darkMode ? 'bg-gray-800 border-primary' : 'bg-primary/10 border-primary'} border rounded-lg px-4 py-3 flex items-center space-x-2`}>
            <svg className="w-5 h-5 text-primary flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              Log in to save your wishlist and track price drops across sessions.
            </span>
          </div>
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16">
              <svg className="w-24 h-24 text-gray-300 mb-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
              <p className={`text-xl font-semibold ${darkMode ? 'text-gray-400' : 'text-gray-500'} mb-2`}>
                Your wishlist is empty.
              </p>
              <p className={`${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                Browse products to start saving!
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {items.map(item => (
                <div
                  key={item.wishlistItemId}
                  className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg overflow-hidden shadow-lg flex flex-col`}
                >
                  <div className={`relative h-56 ${darkMode ? 'bg-gradient-to-t from-gray-700 to-gray-800' : 'bg-gradient-to-t from-gray-100 to-white'} transition-colors duration-300`}>
                    {item.imgName && (
                      <img src={`/${item.imgName}`} alt={item.name ?? `Product ${item.productId}`} className="w-full h-full object-contain p-2" />
                    )}
                    <button
                      onClick={() => removeFromWishlist(item.productId)}
                      className="absolute top-2 left-2 p-1.5 rounded-full bg-white/80 hover:bg-white shadow transition-colors"
                      aria-label={`Remove ${item.name ?? 'item'} from wishlist`}
                    >
                      <svg className="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                        <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                      </svg>
                    </button>
                  </div>
                  <div className="p-4">
                    <h3 className={`text-xl font-semibold ${darkMode ? 'text-light' : 'text-gray-800'} transition-colors duration-300`}>
                      {item.name ?? `Product #${item.productId}`}
                    </h3>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className={`min-h-screen ${darkMode ? 'bg-dark' : 'bg-gray-100'} pt-20 px-4 transition-colors duration-300`}>
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-primary"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`min-h-screen ${darkMode ? 'bg-dark' : 'bg-gray-100'} pt-20 px-4 transition-colors duration-300`}>
        <div className="max-w-7xl mx-auto">
          <div className="text-red-500 text-center">Failed to load wishlist</div>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-dark' : 'bg-gray-100'} pt-20 pb-16 px-4 transition-colors duration-300`}>
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col space-y-6">
          <h1 className={`text-3xl font-bold ${darkMode ? 'text-light' : 'text-gray-800'} transition-colors duration-300`}>
            My Wishlist
          </h1>

          {/* Summary bar */}
          {items.length > 0 && (
            <div className={`${darkMode ? 'bg-gray-800 text-light' : 'bg-white text-gray-700'} rounded-lg px-4 py-3 flex items-center space-x-2 shadow transition-colors duration-300`}>
              <span className="font-medium">{items.length} {items.length === 1 ? 'item' : 'items'}</span>
              {totalSavings > 0 && (
                <>
                  <span className="text-gray-400">·</span>
                  <span className="text-green-500 font-semibold">
                    You could save ${totalSavings.toFixed(2)} today!
                  </span>
                </>
              )}
            </div>
          )}

          {items.length === 0 ? (
            /* Empty state */
            <div className="flex flex-col items-center justify-center py-24">
              <svg className="w-24 h-24 text-gray-300 mb-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
              <p className={`text-xl font-semibold ${darkMode ? 'text-gray-400' : 'text-gray-500'} mb-2`}>
                Your wishlist is empty.
              </p>
              <p className={`${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                Browse products to start saving!
              </p>
            </div>
          ) : (
            <>
              {/* Sort bar */}
              <div className="flex items-center space-x-3">
                <label
                  htmlFor="wishlist-sort"
                  className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}
                >
                  Sort by:
                </label>
                <select
                  id="wishlist-sort"
                  value={sortBy}
                  onChange={e => setSortBy(e.target.value as SortOption)}
                  className={`text-sm rounded-lg border px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-primary ${
                    darkMode
                      ? 'bg-gray-800 text-light border-gray-700'
                      : 'bg-white text-gray-800 border-gray-300'
                  } transition-colors duration-300`}
                >
                  <option value="recent">Recently added</option>
                  <option value="priceDrop">Biggest price drop</option>
                  <option value="lowestPrice">Lowest price now</option>
                  <option value="alphabetical">Alphabetical</option>
                </select>
              </div>

              {/* Product grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {sortedItems.map(item => {
                  const priceDrop = item.priceDrop ?? 0;
                  const currentPrice = item.currentPrice ?? item.priceAtTimeOfAdding;
                  return (
                    <div
                      key={item.wishlistItemId}
                      className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg overflow-hidden shadow-lg transform transition-all duration-300 hover:scale-105 hover:shadow-[0_0_25px_rgba(118,184,82,0.3)] flex flex-col`}
                    >
                      {/* Image area */}
                      <div className={`relative h-56 ${darkMode ? 'bg-gradient-to-t from-gray-700 to-gray-800' : 'bg-gradient-to-t from-gray-100 to-white'} transition-colors duration-300`}>
                        {item.imgName && (
                          <img
                            src={`/${item.imgName}`}
                            alt={item.name ?? `Product ${item.productId}`}
                            className="w-full h-full object-contain p-2"
                          />
                        )}

                        {/* Price drop badge */}
                        {priceDrop > 0 && (
                          <div className="absolute top-2 right-2 bg-green-500 text-white text-xs font-bold px-2 py-1 rounded-full shadow">
                            ↓ Save ${priceDrop.toFixed(2)}
                          </div>
                        )}

                        {/* Remove (heart) button */}
                        <button
                          onClick={() => removeFromWishlist(item.productId)}
                          className="absolute top-2 left-2 p-1.5 rounded-full bg-white/80 hover:bg-white shadow transition-colors"
                          aria-label={`Remove ${item.name ?? 'item'} from wishlist`}
                        >
                          <svg className="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                          </svg>
                        </button>
                      </div>

                      {/* Card body */}
                      <div className="p-4 flex flex-col flex-grow">
                        <h3 className={`text-xl font-semibold ${darkMode ? 'text-light' : 'text-gray-800'} mb-2 transition-colors duration-300`}>
                          {item.name ?? `Product #${item.productId}`}
                        </h3>

                        <div className="space-y-2 mt-auto">
                          {/* Price info */}
                          <div className="flex items-baseline space-x-2">
                            <span className="text-primary text-xl font-bold">
                              ${currentPrice.toFixed(2)}
                            </span>
                            {priceDrop > 0 && (
                              <span className="text-gray-500 line-through text-sm">
                                was ${item.priceAtTimeOfAdding.toFixed(2)}
                              </span>
                            )}
                          </div>

                          {/* Price change indicator */}
                          {priceDrop > 0 && (
                            <div className="text-green-500 text-xs font-semibold">
                              Price dropped! Save ${priceDrop.toFixed(2)}
                            </div>
                          )}
                          {priceDrop < 0 && (
                            <div className="text-gray-400 text-xs">
                              Price increased
                            </div>
                          )}

                          {/* Add to Cart stub */}
                          <button
                            onClick={() => alert(`Added ${item.name ?? 'item'} to cart`)}
                            className="w-full mt-2 px-4 py-2 rounded-lg bg-primary hover:bg-accent text-white transition-colors"
                            aria-label={`Add ${item.name ?? 'item'} to cart`}
                          >
                            Add to Cart
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
