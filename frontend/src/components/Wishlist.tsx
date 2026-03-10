import { useState } from 'react';
import { useQuery } from 'react-query';
import axios from 'axios';
import { useTheme } from '../context/ThemeContext';
import { useWishlist } from '../context/WishlistContext';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/config';
import { Navigate } from 'react-router-dom';

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
  const { isLoggedIn } = useAuth();
  const {
    wishlists,
    activeWishlistId,
    activeWishlist,
    activeWishlistItems,
    setActiveWishlistId,
    createWishlist,
    deleteWishlist,
    removeFromWishlist,
    makePublic,
    getShareUrl,
  } = useWishlist();

  const [newWishlistName, setNewWishlistName] = useState('');
  const [showNewWishlistInput, setShowNewWishlistInput] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);
  const [copiedId, setCopiedId] = useState<number | null>(null);

  const { data: products = [] } = useQuery<Product[]>('products', fetchProducts);

  if (!isLoggedIn) {
    return <Navigate to="/login" replace />;
  }

  const handleCreateWishlist = async () => {
    const name = newWishlistName.trim();
    if (!name) return;
    await createWishlist(name);
    setNewWishlistName('');
    setShowNewWishlistInput(false);
  };

  const handleDeleteWishlist = async (id: number) => {
    await deleteWishlist(id);
    setDeleteConfirmId(null);
  };

  const handleMakePublic = async (wishlistId: number) => {
    await makePublic(wishlistId);
  };

  const handleCopyShareUrl = (wishlistId: number) => {
    const url = getShareUrl(wishlistId);
    navigator.clipboard.writeText(url);
    setCopiedId(wishlistId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Cross-reference wishlist items with product data
  const activeProducts = activeWishlistItems
    .map(item => ({
      item,
      product: products.find(p => p.productId === item.productId),
    }))
    .filter((entry): entry is { item: typeof activeWishlistItems[0]; product: Product } =>
      entry.product !== undefined
    );

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-dark' : 'bg-gray-100'} pt-20 pb-16 px-4 transition-colors duration-300`}>
      <div className="max-w-7xl mx-auto">
        <h1 className={`text-3xl font-bold mb-6 ${darkMode ? 'text-light' : 'text-gray-800'}`}>
          My Wishlists
        </h1>
        <div className="flex flex-col md:flex-row gap-6">
          {/* Sidebar — Wishlist manager */}
          <aside className={`w-full md:w-64 flex-shrink-0 ${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow p-4 self-start transition-colors duration-300`}>
            <div className="flex items-center justify-between mb-4">
              <h2 className={`text-lg font-semibold ${darkMode ? 'text-light' : 'text-gray-800'}`}>
                Wishlists
              </h2>
              <button
                onClick={() => setShowNewWishlistInput(v => !v)}
                className="p-1 rounded-full hover:bg-primary hover:text-white transition-colors"
                aria-label="New wishlist"
                title="New wishlist"
              >
                <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                </svg>
              </button>
            </div>

            {showNewWishlistInput && (
              <div className="mb-3 flex gap-2">
                <input
                  type="text"
                  value={newWishlistName}
                  onChange={e => setNewWishlistName(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleCreateWishlist()}
                  placeholder="Wishlist name"
                  maxLength={100}
                  className={`flex-1 px-2 py-1 text-sm rounded border ${darkMode ? 'bg-gray-700 text-light border-gray-600' : 'bg-white text-gray-800 border-gray-300'} focus:outline-none focus:border-primary`}
                  autoFocus
                />
                <button
                  onClick={handleCreateWishlist}
                  className="px-2 py-1 bg-primary text-white text-sm rounded hover:bg-accent transition-colors"
                >
                  Add
                </button>
              </div>
            )}

            <ul className="space-y-1">
              {wishlists.length === 0 && (
                <li className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'} py-2`}>
                  No wishlists yet.
                </li>
              )}
              {wishlists.map(wl => (
                <li key={wl.wishlistId}>
                  <div
                    className={`flex items-center justify-between rounded-md px-3 py-2 cursor-pointer transition-colors ${
                      activeWishlistId === wl.wishlistId
                        ? 'bg-primary text-white'
                        : darkMode
                        ? 'text-light hover:bg-gray-700'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                    onClick={() => setActiveWishlistId(wl.wishlistId)}
                  >
                    <span className="text-sm font-medium truncate flex-1">{wl.name}</span>
                    <button
                      onClick={e => {
                        e.stopPropagation();
                        setDeleteConfirmId(wl.wishlistId);
                      }}
                      className={`ml-1 p-1 rounded hover:text-red-500 transition-colors ${activeWishlistId === wl.wishlistId ? 'text-white hover:text-red-200' : ''}`}
                      aria-label={`Delete ${wl.name}`}
                      title="Delete wishlist"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>

                  {/* Delete confirmation */}
                  {deleteConfirmId === wl.wishlistId && (
                    <div className={`mt-1 p-2 rounded-md text-xs ${darkMode ? 'bg-gray-700 text-light' : 'bg-gray-100 text-gray-700'}`}>
                      <p className="mb-2">Delete "{wl.name}"?</p>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleDeleteWishlist(wl.wishlistId)}
                          className="px-2 py-1 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
                        >
                          Delete
                        </button>
                        <button
                          onClick={() => setDeleteConfirmId(null)}
                          className={`px-2 py-1 rounded ${darkMode ? 'bg-gray-600 text-light hover:bg-gray-500' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'} transition-colors`}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Share section */}
                  {activeWishlistId === wl.wishlistId && (
                    <div className={`mt-1 px-3 py-2 ${darkMode ? 'bg-gray-700' : 'bg-gray-50'} rounded-md`}>
                      {wl.isPublic ? (
                        <div>
                          <p className={`text-xs mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                            Share URL:
                          </p>
                          <div className="flex gap-1 items-center">
                            <input
                              readOnly
                              value={getShareUrl(wl.wishlistId)}
                              className={`flex-1 text-xs px-2 py-1 rounded border ${darkMode ? 'bg-gray-800 text-light border-gray-600' : 'bg-white text-gray-800 border-gray-300'} focus:outline-none`}
                            />
                            <button
                              onClick={() => handleCopyShareUrl(wl.wishlistId)}
                              className="px-2 py-1 bg-primary text-white text-xs rounded hover:bg-accent transition-colors"
                              aria-label="Copy share URL"
                            >
                              {copiedId === wl.wishlistId ? '✓' : 'Copy'}
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button
                          onClick={() => handleMakePublic(wl.wishlistId)}
                          className={`text-xs flex items-center gap-1 ${darkMode ? 'text-gray-300 hover:text-primary' : 'text-gray-600 hover:text-primary'} transition-colors`}
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                          </svg>
                          Make shareable
                        </button>
                      )}
                    </div>
                  )}
                </li>
              ))}
            </ul>
          </aside>

          {/* Main area — Product grid */}
          <main className="flex-1">
            {!activeWishlist ? (
              <div className={`flex flex-col items-center justify-center h-64 rounded-lg ${darkMode ? 'bg-gray-800' : 'bg-white'} shadow transition-colors duration-300`}>
                <svg className="w-12 h-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
                <p className={`text-lg ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  {wishlists.length === 0
                    ? 'Create a wishlist to get started'
                    : 'Select a wishlist to view its items'}
                </p>
              </div>
            ) : (
              <>
                <h2 className={`text-xl font-semibold mb-4 ${darkMode ? 'text-light' : 'text-gray-800'}`}>
                  {activeWishlist.name}
                  <span className={`ml-2 text-sm font-normal ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    ({activeWishlistItems.length} {activeWishlistItems.length === 1 ? 'item' : 'items'})
                  </span>
                </h2>

                {activeProducts.length === 0 ? (
                  <div className={`flex flex-col items-center justify-center h-48 rounded-lg ${darkMode ? 'bg-gray-800' : 'bg-white'} shadow transition-colors duration-300`}>
                    <p className={`text-lg ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      This wishlist is empty. Browse products to add items.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                    {activeProducts.map(({ item, product }) => (
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
                          <div className="flex items-center justify-between mt-auto">
                            {product.discount ? (
                              <div>
                                <span className="text-gray-500 line-through text-sm mr-1">${product.price.toFixed(2)}</span>
                                <span className="text-primary font-bold">${(product.price * (1 - product.discount)).toFixed(2)}</span>
                              </div>
                            ) : (
                              <span className="text-primary font-bold">${product.price.toFixed(2)}</span>
                            )}
                            <button
                              onClick={() => removeFromWishlist(item.wishlistItemId)}
                              className="p-2 rounded-full text-red-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                              aria-label={`Remove ${product.name} from wishlist`}
                              title="Remove from wishlist"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24">
                                <path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
