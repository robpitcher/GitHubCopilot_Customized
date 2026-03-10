import { useParams, Link } from 'react-router-dom';
import { useQuery } from 'react-query';
import axios from 'axios';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/config';

interface Product {
  productId: number;
  name: string;
  description: string;
  price: number;
  imgName: string;
  sku: string;
  unit: string;
  supplierId: number;
  discount?: number;
}

interface WishlistItem {
  wishlistItemId: number;
  wishlistId: number;
  productId: number;
  addedAt: string;
}

interface SharedWishlistResponse {
  wishlist: {
    wishlistId: number;
    userId: string;
    name: string;
    shareToken: string;
    createdAt: string;
    isPublic: boolean;
  };
  items: WishlistItem[];
}

const fetchSharedWishlist = async (token: string): Promise<SharedWishlistResponse> => {
  const { data } = await axios.get(
    `${api.baseURL}${api.endpoints.wishlists}/share/${token}`
  );
  return data;
};

const fetchProducts = async (): Promise<Product[]> => {
  const { data } = await axios.get(`${api.baseURL}${api.endpoints.products}`);
  return data;
};

export default function SharedWishlist() {
  const { token } = useParams<{ token: string }>();
  const { darkMode } = useTheme();
  const { isLoggedIn } = useAuth();

  const {
    data: sharedData,
    isLoading,
    error,
  } = useQuery<SharedWishlistResponse>(
    ['sharedWishlist', token],
    () => fetchSharedWishlist(token!),
    { enabled: !!token, retry: false }
  );

  const { data: products = [] } = useQuery<Product[]>('products', fetchProducts, {
    enabled: !!sharedData,
  });

  if (isLoading) {
    return (
      <div className={`min-h-screen ${darkMode ? 'bg-dark' : 'bg-gray-100'} pt-20 px-4 transition-colors duration-300`}>
        <div className="max-w-7xl mx-auto flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  if (error || !sharedData) {
    return (
      <div className={`min-h-screen ${darkMode ? 'bg-dark' : 'bg-gray-100'} pt-20 px-4 transition-colors duration-300`}>
        <div className="max-w-7xl mx-auto text-center py-16">
          <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h2 className={`text-2xl font-bold mb-2 ${darkMode ? 'text-light' : 'text-gray-800'}`}>
            Wishlist not found
          </h2>
          <p className={`${darkMode ? 'text-gray-400' : 'text-gray-500'} mb-6`}>
            This wishlist doesn't exist or is no longer public.
          </p>
          <Link to="/" className="bg-primary hover:bg-accent text-white px-6 py-2 rounded-md transition-colors">
            Go Home
          </Link>
        </div>
      </div>
    );
  }

  const { wishlist, items } = sharedData;

  const sharedProducts = items
    .map(item => ({
      item,
      product: products.find(p => p.productId === item.productId),
    }))
    .filter((entry): entry is { item: WishlistItem; product: Product } =>
      entry.product !== undefined
    );

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-dark' : 'bg-gray-100'} pt-20 pb-16 px-4 transition-colors duration-300`}>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <svg className="w-7 h-7 text-primary" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
            </svg>
            <h1 className={`text-3xl font-bold ${darkMode ? 'text-light' : 'text-gray-800'}`}>
              {wishlist.name}
            </h1>
          </div>
          <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            {items.length} {items.length === 1 ? 'item' : 'items'} · Shared wishlist
          </p>
        </div>

        {/* CTA for non-logged-in users */}
        {!isLoggedIn && (
          <div className={`mb-6 p-4 rounded-lg border ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-blue-50 border-blue-200'} flex items-center justify-between gap-4`}>
            <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-blue-800'}`}>
              Want to save products to your own wishlist?
            </p>
            <Link
              to="/login"
              className="bg-primary hover:bg-accent text-white px-4 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap"
            >
              Login to save
            </Link>
          </div>
        )}

        {/* Product grid */}
        {sharedProducts.length === 0 ? (
          <div className={`flex flex-col items-center justify-center h-48 rounded-lg ${darkMode ? 'bg-gray-800' : 'bg-white'} shadow`}>
            <p className={`text-lg ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              This wishlist is empty.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {sharedProducts.map(({ item, product }) => (
              <div
                key={item.wishlistItemId}
                className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg overflow-hidden shadow-lg flex flex-col transition-colors duration-300`}
              >
                <div className={`relative h-48 ${darkMode ? 'bg-gradient-to-t from-gray-700 to-gray-800' : 'bg-gradient-to-t from-gray-100 to-white'}`}>
                  <img
                    src={`/${product.imgName}`}
                    alt={product.name}
                    className="w-full h-full object-contain p-2"
                  />
                  {product.discount && (
                    <div className="absolute top-8 left-0 bg-primary text-white px-3 py-1 -rotate-90 transform -translate-x-5 shadow-md">
                      {Math.round(product.discount * 100)}% OFF
                    </div>
                  )}
                </div>
                <div className="p-4 flex flex-col flex-grow">
                  <h3 className={`text-lg font-semibold mb-1 ${darkMode ? 'text-light' : 'text-gray-800'}`}>
                    {product.name}
                  </h3>
                  <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'} mb-3 flex-grow`}>
                    {product.description}
                  </p>
                  <div className="mt-auto">
                    {product.discount ? (
                      <div>
                        <span className="text-gray-500 line-through text-sm mr-1">
                          ${product.price.toFixed(2)}
                        </span>
                        <span className="text-primary font-bold">
                          ${(product.price * (1 - product.discount)).toFixed(2)}
                        </span>
                      </div>
                    ) : (
                      <span className="text-primary font-bold">${product.price.toFixed(2)}</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
