import { useState } from 'react';
import axios from 'axios';
import { useQuery } from 'react-query';
import { api } from '../api/config';
import { useTheme } from '../context/ThemeContext';
import { useWishlist } from '../context/WishlistContext';

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

const fetchProducts = async (): Promise<Product[]> => {
  const { data } = await axios.get(`${api.baseURL}${api.endpoints.products}`);
  return data;
};

export default function Wishlist() {
  const { darkMode } = useTheme();
  const { wishlistIds, removeFromWishlist } = useWishlist();
  const [searchTerm, setSearchTerm] = useState('');
  const [quantities, setQuantities] = useState<Record<number, number>>({});
  const { data: products, isLoading } = useQuery('products', fetchProducts);

  const wishlistProducts = products?.filter(p => wishlistIds.includes(p.productId)) ?? [];

  const filteredProducts = wishlistProducts.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleQuantityChange = (productId: number, change: number) => {
    setQuantities(prev => ({
      ...prev,
      [productId]: Math.max(0, (prev[productId] || 0) + change)
    }));
  };

  const handleAddToCart = (productId: number, productName: string) => {
    const quantity = quantities[productId] || 0;
    if (quantity > 0) {
      // TODO: Implement cart functionality
      alert(`Added ${quantity} ${productName} to cart`);
      setQuantities(prev => ({ ...prev, [productId]: 0 }));
    }
  };

  if (isLoading && wishlistIds.length > 0) {
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

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-dark' : 'bg-gray-100'} pt-20 pb-16 px-4 transition-colors duration-300`}>
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col space-y-6">
          <h1 className={`text-3xl font-bold ${darkMode ? 'text-light' : 'text-gray-800'} transition-colors duration-300`}>
            My Wishlist
            {wishlistIds.length > 0 && (
              <span className="ml-3 text-lg font-normal text-primary">({wishlistIds.length} {wishlistIds.length === 1 ? 'item' : 'items'})</span>
            )}
          </h1>

          {wishlistIds.length === 0 ? (
            <div className={`flex flex-col items-center justify-center py-24 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-24 w-24 mb-6 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
              <p className="text-2xl font-semibold mb-2">Your wishlist is empty</p>
              <p className="text-base">Browse products and click the heart icon to save items here.</p>
            </div>
          ) : (
            <>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search wishlist..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className={`w-full px-4 py-2 ${darkMode ? 'bg-gray-800 text-light border-gray-700' : 'bg-white text-gray-800 border-gray-300'} rounded-lg border focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-colors duration-300`}
                  aria-label="Search wishlist"
                />
                <svg
                  className={`absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 ${darkMode ? 'text-gray-400' : 'text-gray-500'} transition-colors duration-300`}
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                </svg>
              </div>

              {filteredProducts.length === 0 ? (
                <div className={`text-center py-12 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  No wishlist items match your search.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                  {filteredProducts.map(product => (
                    <div key={product.productId} className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg overflow-hidden shadow-lg transform transition-all duration-300 hover:scale-105 hover:shadow-[0_0_25px_rgba(118,184,82,0.3)] flex flex-col`}>
                      <div className={`relative h-56 ${darkMode ? 'bg-gradient-to-t from-gray-700 to-gray-800' : 'bg-gradient-to-t from-gray-100 to-white'} transition-colors duration-300`}>
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
                        <button
                          onClick={() => removeFromWishlist(product.productId)}
                          className="absolute top-2 right-2 p-2 rounded-full bg-white/80 hover:bg-white shadow transition-colors duration-200"
                          aria-label={`Remove ${product.name} from wishlist`}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-primary" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                          </svg>
                        </button>
                      </div>

                      <div className="p-4 flex flex-col flex-grow">
                        <h3 className={`text-xl font-semibold ${darkMode ? 'text-light' : 'text-gray-800'} mb-2 transition-colors duration-300`}>{product.name}</h3>
                        <p className={`${darkMode ? 'text-gray-400' : 'text-gray-600'} mb-4 flex-grow transition-colors duration-300`}>{product.description}</p>
                        <div className="space-y-4 mt-auto">
                          <div className="flex justify-between items-center">
                            {product.discount ? (
                              <div>
                                <span className="text-gray-500 line-through text-sm mr-2">${product.price.toFixed(2)}</span>
                                <span className="text-primary text-xl font-bold">${(product.price * (1 - product.discount)).toFixed(2)}</span>
                              </div>
                            ) : (
                              <span className="text-primary text-xl font-bold">${product.price.toFixed(2)}</span>
                            )}
                          </div>

                          <div className="flex items-center justify-between">
                            <div className={`flex items-center space-x-3 ${darkMode ? 'bg-gray-700' : 'bg-gray-200'} rounded-lg p-1 transition-colors duration-300`}>
                              <button
                                onClick={() => handleQuantityChange(product.productId, -1)}
                                className={`w-8 h-8 flex items-center justify-center ${darkMode ? 'text-light' : 'text-gray-700'} hover:text-primary transition-colors duration-300`}
                                aria-label={`Decrease quantity of ${product.name}`}
                              >
                                <span aria-hidden="true">-</span>
                              </button>
                              <span
                                className={`${darkMode ? 'text-light' : 'text-gray-800'} min-w-[2rem] text-center transition-colors duration-300`}
                                aria-label={`Quantity of ${product.name}`}
                              >
                                {quantities[product.productId] || 0}
                              </span>
                              <button
                                onClick={() => handleQuantityChange(product.productId, 1)}
                                className={`w-8 h-8 flex items-center justify-center ${darkMode ? 'text-light' : 'text-gray-700'} hover:text-primary transition-colors duration-300`}
                                aria-label={`Increase quantity of ${product.name}`}
                              >
                                <span aria-hidden="true">+</span>
                              </button>
                            </div>
                            <button
                              onClick={() => handleAddToCart(product.productId, product.name)}
                              className={`px-4 py-2 rounded-lg transition-colors ${
                                quantities[product.productId]
                                  ? 'bg-primary hover:bg-accent text-white'
                                  : `${darkMode ? 'bg-gray-700 text-gray-400' : 'bg-gray-200 text-gray-500'} cursor-not-allowed`
                              }`}
                              disabled={!quantities[product.productId]}
                              aria-label={`Add ${quantities[product.productId] || 0} ${product.name} to cart`}
                            >
                              Add to Cart
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
