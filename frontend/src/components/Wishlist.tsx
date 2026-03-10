import { Link } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { useWishlist } from '../context/WishlistContext';

export default function Wishlist() {
  const { darkMode } = useTheme();
  const { wishlist, removeFromWishlist } = useWishlist();

  const handleAddToCart = (productId: number) => {
    // TODO: Implement cart functionality
    alert(`Added product ${productId} to cart`);
  };

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-dark' : 'bg-gray-100'} pt-20 pb-16 px-4 transition-colors duration-300`}>
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col space-y-6">
          <div className="flex items-center gap-3">
            <h1 className={`text-3xl font-bold ${darkMode ? 'text-light' : 'text-gray-800'} transition-colors duration-300`}>
              My Wishlist
            </h1>
            {wishlist.length > 0 && (
              <span className="bg-primary text-white text-sm font-semibold px-2.5 py-0.5 rounded-full">
                {wishlist.length}
              </span>
            )}
          </div>

          {wishlist.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 space-y-6">
              <svg
                className={`w-24 h-24 ${darkMode ? 'text-gray-600' : 'text-gray-300'}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="1.5"
                  d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                />
              </svg>
              <p className={`text-xl ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                Your wishlist is empty
              </p>
              <Link
                to="/products"
                className="bg-primary hover:bg-accent text-white px-6 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                Browse Products
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {wishlist.map(item => (
                <div
                  key={item.productId}
                  className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg overflow-hidden shadow-lg transform transition-all duration-300 hover:scale-105 hover:shadow-[0_0_25px_rgba(118,184,82,0.3)] flex flex-col`}
                >
                  <div className={`relative h-56 ${darkMode ? 'bg-gradient-to-t from-gray-700 to-gray-800' : 'bg-gradient-to-t from-gray-100 to-white'} transition-colors duration-300`}>
                    <img
                      src={`/${item.imgName}`}
                      alt={item.name}
                      className="w-full h-full object-contain p-2"
                    />
                    <button
                      onClick={() => removeFromWishlist(item.productId)}
                      className="absolute top-2 right-2 p-1.5 rounded-full bg-white/80 hover:bg-white transition-colors shadow"
                      aria-label={`Remove ${item.name} from wishlist`}
                    >
                      <svg className="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                      </svg>
                    </button>
                  </div>

                  <div className="p-4 flex flex-col flex-grow">
                    <h3 className={`text-xl font-semibold ${darkMode ? 'text-light' : 'text-gray-800'} mb-2 transition-colors duration-300`}>
                      {item.name}
                    </h3>
                    <div className="space-y-4 mt-auto">
                      <div className="flex justify-between items-center">
                        {item.discount ? (
                          <div>
                            <span className="text-gray-500 line-through text-sm mr-2">${item.price.toFixed(2)}</span>
                            <span className="text-primary text-xl font-bold">${(item.price * (1 - item.discount)).toFixed(2)}</span>
                          </div>
                        ) : (
                          <span className="text-primary text-xl font-bold">${item.price.toFixed(2)}</span>
                        )}
                      </div>
                      <button
                        onClick={() => handleAddToCart(item.productId)}
                        className="w-full px-4 py-2 rounded-lg bg-primary hover:bg-accent text-white transition-colors"
                        aria-label={`Add ${item.name} to cart`}
                      >
                        Add to Cart
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
