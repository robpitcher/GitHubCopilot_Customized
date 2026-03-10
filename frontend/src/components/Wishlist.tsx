import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useWishlist } from '../context/WishlistContext';

export default function Wishlist() {
  const { isLoggedIn } = useAuth();
  const { darkMode } = useTheme();
  const { wishlistItems, isLoading, error, removeFromWishlist } = useWishlist();

  if (!isLoggedIn) {
    return (
      <div className={`min-h-screen ${darkMode ? 'bg-dark' : 'bg-gray-100'} pt-20 px-4 flex items-center justify-center transition-colors duration-300`}>
        <div className="text-center">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className={`h-16 w-16 mx-auto mb-4 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth="1"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
          <h2 className={`text-2xl font-bold ${darkMode ? 'text-light' : 'text-gray-800'} mb-2`}>
            Your Wishlist
          </h2>
          <p className={`${darkMode ? 'text-gray-400' : 'text-gray-600'} mb-6`}>
            Please log in to view and manage your wishlist.
          </p>
          <Link
            to="/login"
            className="bg-primary hover:bg-accent text-white px-6 py-2 rounded-md transition-colors"
          >
            Login
          </Link>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className={`min-h-screen ${darkMode ? 'bg-dark' : 'bg-gray-100'} pt-20 px-4 transition-colors duration-300`}>
        <div className="max-w-7xl mx-auto flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`min-h-screen ${darkMode ? 'bg-dark' : 'bg-gray-100'} pt-20 px-4 transition-colors duration-300`}>
        <div className="max-w-7xl mx-auto">
          <div className="text-red-500 text-center">{error}</div>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-dark' : 'bg-gray-100'} pt-20 pb-16 px-4 transition-colors duration-300`}>
      <div className="max-w-7xl mx-auto">
        <h1 className={`text-3xl font-bold ${darkMode ? 'text-light' : 'text-gray-800'} mb-8`}>
          My Wishlist
        </h1>

        {wishlistItems.length === 0 ? (
          <div className="text-center py-16">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className={`h-16 w-16 mx-auto mb-4 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="1"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
            <p className={`text-xl ${darkMode ? 'text-gray-400' : 'text-gray-600'} mb-4`}>
              Your wishlist is empty
            </p>
            <Link
              to="/products"
              className="bg-primary hover:bg-accent text-white px-6 py-2 rounded-md transition-colors"
            >
              Browse Products
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {wishlistItems.map(item => (
              <div
                key={item.wishlistId}
                className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg overflow-hidden shadow-lg flex flex-col transition-colors duration-300`}
              >
                {item.product && (
                  <>
                    <div className={`relative h-48 ${darkMode ? 'bg-gradient-to-t from-gray-700 to-gray-800' : 'bg-gradient-to-t from-gray-100 to-white'}`}>
                      <img
                        src={`/${item.product.imgName}`}
                        alt={item.product.name}
                        className="w-full h-full object-contain p-2"
                      />
                    </div>
                    <div className="p-4 flex flex-col flex-grow">
                      <h3 className={`text-lg font-semibold ${darkMode ? 'text-light' : 'text-gray-800'} mb-1`}>
                        {item.product.name}
                      </h3>
                      <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'} mb-3 flex-grow`}>
                        {item.product.description}
                      </p>
                      <div className="flex justify-between items-center mt-auto">
                        {item.product.discount ? (
                          <div>
                            <span className="text-gray-500 line-through text-sm mr-1">
                              ${item.product.price.toFixed(2)}
                            </span>
                            <span className="text-primary font-bold">
                              ${(item.product.price * (1 - item.product.discount)).toFixed(2)}
                            </span>
                          </div>
                        ) : (
                          <span className="text-primary font-bold">
                            ${item.product.price.toFixed(2)}
                          </span>
                        )}
                        <button
                          onClick={() => removeFromWishlist(item.productId)}
                          className="text-red-500 hover:text-red-700 transition-colors p-1"
                          aria-label={`Remove ${item.product.name} from wishlist`}
                          title="Remove from wishlist"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-5 w-5"
                            fill="currentColor"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth="2"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                          </svg>
                        </button>
                      </div>
                      <p className={`text-xs mt-2 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                        Added {new Date(item.addedAt).toLocaleDateString()}
                      </p>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
