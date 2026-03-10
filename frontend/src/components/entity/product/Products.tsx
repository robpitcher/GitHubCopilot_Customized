import { useState } from 'react';
import axios from 'axios';
import { useQuery } from 'react-query';
import { api } from '../../../api/config';
import { useTheme } from '../../../context/ThemeContext';
import { useAuth } from '../../../context/AuthContext';
import { useWishlist } from '../../../context/WishlistContext';
import PriceHistoryChart from '../../product/PriceHistoryChart';
import { toast, Toaster } from 'react-hot-toast';

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

export default function Products() {
  const [quantities, setQuantities] = useState<Record<number, number>>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [wishlistPriority, setWishlistPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [wishlistNotes, setWishlistNotes] = useState('');
  const [wishlistPriceDrop, setWishlistPriceDrop] = useState(false);
  const { data: products, isLoading, error } = useQuery('products', fetchProducts);
  const { darkMode } = useTheme();
  const { isLoggedIn } = useAuth();
  const { items: wishlistItems, addItem: addToWishlist } = useWishlist();

  const wishlistProductIds = new Set(wishlistItems.map(i => i.productId));

  const filteredProducts = products?.filter(product => 
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleQuantityChange = (productId: number, change: number) => {
    setQuantities(prev => ({
      ...prev,
      [productId]: Math.max(0, (prev[productId] || 0) + change)
    }));
  };

  const handleAddToCart = (productId: number) => {
    const quantity = quantities[productId] || 0;
    if (quantity > 0) {
      // TODO: Implement cart functionality
      alert(`Added ${quantity} items to cart`);
      setQuantities(prev => ({
        ...prev,
        [productId]: 0
      }));
    }
  };

  const handleProductClick = (product: Product) => {
    setSelectedProduct(product);
    setWishlistPriority('medium');
    setWishlistNotes('');
    setWishlistPriceDrop(false);
    setShowModal(true);
  };

  const handleAddToWishlist = async (productId: number, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!isLoggedIn) {
      toast.error('Please log in to add to wishlist');
      return;
    }
    try {
      await addToWishlist(productId, {
        priority: wishlistPriority,
        notes: wishlistNotes || undefined,
        notifyOnPriceDrop: wishlistPriceDrop
      });
      toast.success('Added to wishlist!');
      setShowModal(false);
    } catch {
      toast.error('Already in wishlist or error occurred');
    }
  };

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
          <div className="text-red-500 text-center">Failed to fetch products</div>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-dark' : 'bg-gray-100'} pt-20 pb-16 px-4 transition-colors duration-300`}>
      <Toaster position="top-right" />
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col space-y-6">
          <h1 className={`text-3xl font-bold ${darkMode ? 'text-light' : 'text-gray-800'} transition-colors duration-300`}>Products</h1>
          
          <div className="relative">
            <input
              type="text"
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`w-full px-4 py-2 ${darkMode ? 'bg-gray-800 text-light border-gray-700' : 'bg-white text-gray-800 border-gray-300'} rounded-lg border focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-colors duration-300`}
              aria-label="Search products"
            />
            <svg 
              className={`absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 ${darkMode ? 'text-gray-400' : 'text-gray-500'} transition-colors duration-300`}
              fill="none" 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth="2" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
            </svg>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {filteredProducts?.map(product => (
              <div key={product.productId} className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg overflow-hidden shadow-lg transform transition-all duration-300 hover:scale-105 hover:shadow-[0_0_25px_rgba(118,184,82,0.3)] flex flex-col`}>
                <div 
                  className={`relative h-56 ${darkMode ? 'bg-gradient-to-t from-gray-700 to-gray-800' : 'bg-gradient-to-t from-gray-100 to-white'} transition-colors duration-300 cursor-pointer`}
                  onClick={() => handleProductClick(product)}
                >
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
                  {/* Wishlist heart button */}
                  <button
                    onClick={() => handleProductClick(product)}
                    className={`absolute top-2 right-2 p-1.5 rounded-full transition-colors ${
                      wishlistProductIds.has(product.productId)
                        ? 'bg-red-100 text-red-500'
                        : `${darkMode ? 'bg-gray-700/80 text-gray-400 hover:text-red-400' : 'bg-white/80 text-gray-400 hover:text-red-500'}`
                    }`}
                    aria-label={wishlistProductIds.has(product.productId) ? `${product.name} is in your wishlist` : `Add ${product.name} to wishlist`}
                  >
                    <svg className="w-4 h-4" fill={wishlistProductIds.has(product.productId) ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
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
                          id={`decrease-qty-${product.productId}`}
                        >
                          <span aria-hidden="true">-</span>
                        </button>
                        <span 
                          className={`${darkMode ? 'text-light' : 'text-gray-800'} min-w-[2rem] text-center transition-colors duration-300`}
                          aria-label={`Quantity of ${product.name}`}
                          id={`qty-${product.productId}`}
                        >
                          {quantities[product.productId] || 0}
                        </span>
                        <button 
                          onClick={() => handleQuantityChange(product.productId, 1)}
                          className={`w-8 h-8 flex items-center justify-center ${darkMode ? 'text-light' : 'text-gray-700'} hover:text-primary transition-colors duration-300`}
                          aria-label={`Increase quantity of ${product.name}`}
                          id={`increase-qty-${product.productId}`}
                        >
                          <span aria-hidden="true">+</span>
                        </button>
                      </div>
                      <button 
                        onClick={() => handleAddToCart(product.productId)}
                        className={`px-4 py-2 rounded-lg transition-colors ${
                          quantities[product.productId] 
                            ? 'bg-primary hover:bg-accent text-white' 
                            : `${darkMode ? 'bg-gray-700 text-gray-400' : 'bg-gray-200 text-gray-500'} cursor-not-allowed`
                        }`}
                        disabled={!quantities[product.productId]}
                        aria-label={`Add ${quantities[product.productId] || 0} ${product.name} to cart`}
                        id={`add-to-cart-${product.productId}`}
                      >
                        Add to Cart
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Product Modal */}
      {showModal && selectedProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50" onClick={() => setShowModal(false)}>
          <div 
            className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-xl transition-colors duration-300`}
            onClick={e => e.stopPropagation()}
          >
            <div className="flex justify-end">
              <button 
                onClick={() => setShowModal(false)}
                className={`${darkMode ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-black'} transition-colors duration-300`}
                aria-label="Close modal"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className={`${darkMode ? 'bg-gradient-to-t from-gray-700 to-gray-800' : 'bg-gradient-to-t from-gray-100 to-white'} rounded-lg mb-6 p-4`}>
              <img 
                src={`/${selectedProduct.imgName}`} 
                alt={selectedProduct.name}
                className="w-full h-auto object-contain max-h-[300px]"
              />
            </div>
            <h2 className={`text-2xl font-bold ${darkMode ? 'text-light' : 'text-gray-800'} mb-2 transition-colors duration-300`}>
              {selectedProduct.name}
            </h2>
            <div className="flex items-center gap-3 mb-3">
              {selectedProduct.discount ? (
                <>
                  <span className="text-gray-500 line-through text-sm">${selectedProduct.price.toFixed(2)}</span>
                  <span className="text-primary text-xl font-bold">${(selectedProduct.price * (1 - selectedProduct.discount)).toFixed(2)}</span>
                  <span className="bg-primary text-white text-xs px-2 py-0.5 rounded-full">{Math.round(selectedProduct.discount * 100)}% OFF</span>
                </>
              ) : (
                <span className="text-primary text-xl font-bold">${selectedProduct.price.toFixed(2)}</span>
              )}
            </div>
            <p className={`${darkMode ? 'text-gray-300' : 'text-gray-600'} text-base mb-6 transition-colors duration-300`}>
              {selectedProduct.description}
            </p>

            {/* Price history chart */}
            <div className="mb-6">
              <PriceHistoryChart
                productId={selectedProduct.productId}
                currentPrice={selectedProduct.discount ? selectedProduct.price * (1 - selectedProduct.discount) : selectedProduct.price}
              />
            </div>

            {/* Wishlist add section */}
            {isLoggedIn && !wishlistProductIds.has(selectedProduct.productId) && (
              <div className={`${darkMode ? 'bg-gray-700' : 'bg-gray-50'} rounded-lg p-4 border ${darkMode ? 'border-gray-600' : 'border-gray-200'}`}>
                <h3 className={`font-semibold text-sm mb-3 ${darkMode ? 'text-light' : 'text-gray-700'}`}>Add to Wishlist</h3>
                <div className="space-y-3">
                  <div className="flex gap-2">
                    <span className={`text-xs mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Priority:</span>
                    {(['low', 'medium', 'high'] as const).map(p => (
                      <button
                        key={p}
                        onClick={() => setWishlistPriority(p)}
                        className={`text-xs px-2 py-1 rounded-full capitalize transition-colors ${
                          wishlistPriority === p
                            ? p === 'high' ? 'bg-red-100 text-red-800 font-semibold' : p === 'medium' ? 'bg-yellow-100 text-yellow-800 font-semibold' : 'bg-blue-100 text-blue-800 font-semibold'
                            : `${darkMode ? 'bg-gray-600 text-gray-300' : 'bg-gray-200 text-gray-500'}`
                        }`}
                        aria-pressed={wishlistPriority === p}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                  <input
                    type="text"
                    placeholder="Add a note (optional)"
                    value={wishlistNotes}
                    onChange={e => setWishlistNotes(e.target.value)}
                    maxLength={200}
                    className={`w-full text-sm rounded px-3 py-1.5 border ${darkMode ? 'bg-gray-600 text-light border-gray-500' : 'bg-white border-gray-300'} focus:outline-none focus:border-primary`}
                    aria-label="Wishlist note"
                  />
                  <label className={`flex items-center gap-2 text-xs cursor-pointer ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                    <input
                      type="checkbox"
                      checked={wishlistPriceDrop}
                      onChange={e => setWishlistPriceDrop(e.target.checked)}
                      className="accent-primary"
                      aria-label="Enable price drop alerts"
                    />
                    Enable price drop alerts
                  </label>
                  <button
                    onClick={() => handleAddToWishlist(selectedProduct.productId)}
                    className="w-full bg-primary hover:bg-accent text-white py-2 rounded-lg text-sm transition-colors flex items-center justify-center gap-2"
                    aria-label={`Add ${selectedProduct.name} to wishlist`}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                    Add to Wishlist
                  </button>
                </div>
              </div>
            )}
            {isLoggedIn && wishlistProductIds.has(selectedProduct.productId) && (
              <div className={`text-sm text-center py-2 rounded-lg ${darkMode ? 'bg-gray-700 text-green-400' : 'bg-green-50 text-green-600'}`}>
                ✓ Already in your wishlist
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}