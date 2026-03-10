import { useQuery } from 'react-query';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { api } from '../api/config';
import { useTheme } from '../context/ThemeContext';
import { useWishlist } from '../context/WishlistContext';
import { useAuth } from '../context/AuthContext';

interface Product {
    productId: number;
    name: string;
    description: string;
    price: number;
    imgName: string;
    discount?: number;
}

const fetchProducts = async (): Promise<Product[]> => {
    const { data } = await axios.get<Product[]>(`${api.baseURL}${api.endpoints.products}`);
    return data;
};

export default function Wishlist() {
    const { darkMode } = useTheme();
    const { wishlistIds, toggleWishlist, wishlistCount } = useWishlist();
    const { isLoggedIn } = useAuth();
    const { data: products } = useQuery('products', fetchProducts);

    const wishlistProducts = products?.filter(p => wishlistIds.includes(p.productId)) ?? [];

    return (
        <div className={`min-h-screen ${darkMode ? 'bg-dark' : 'bg-gray-100'} pt-20 pb-16 px-4 transition-colors duration-300`}>
            <div className="max-w-7xl mx-auto">
                <h1 className={`text-3xl font-bold ${darkMode ? 'text-light' : 'text-gray-800'} mb-6 transition-colors duration-300`}>
                    My Wishlist
                    {wishlistCount > 0 && (
                        <span className="ml-3 text-lg font-normal text-primary">({wishlistCount} {wishlistCount === 1 ? 'item' : 'items'})</span>
                    )}
                </h1>

                {!isLoggedIn && (
                    <div className={`mb-6 p-4 rounded-lg border ${darkMode ? 'bg-blue-900/20 border-blue-700 text-blue-300' : 'bg-blue-50 border-blue-300 text-blue-800'} flex items-center gap-3`}>
                        <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M12 2a10 10 0 110 20A10 10 0 0112 2z" />
                        </svg>
                        <span>
                            <Link to="/login" className="underline font-semibold hover:text-primary">Login</Link> to save your wishlist across devices and never lose your favourites.
                        </span>
                    </div>
                )}

                {wishlistProducts.length === 0 ? (
                    <div className={`text-center py-20 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                        <svg className="mx-auto w-16 h-16 mb-4 opacity-40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                        </svg>
                        <p className="text-xl mb-2">Your wishlist is empty</p>
                        <p className="mb-6">Browse products and click the heart icon to add items.</p>
                        <Link
                            to="/products"
                            className="bg-primary hover:bg-accent text-white px-6 py-2 rounded-lg transition-colors"
                        >
                            Browse Products
                        </Link>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                        {wishlistProducts.map(product => (
                            <div key={product.productId} className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg overflow-hidden shadow-lg flex flex-col`}>
                                <div className={`relative h-48 ${darkMode ? 'bg-gradient-to-t from-gray-700 to-gray-800' : 'bg-gradient-to-t from-gray-100 to-white'}`}>
                                    <img
                                        src={`/${product.imgName}`}
                                        alt={product.name}
                                        className="w-full h-full object-contain p-2"
                                    />
                                    <button
                                        onClick={() => toggleWishlist(product.productId)}
                                        className="absolute top-2 right-2 p-1.5 rounded-full bg-white/80 hover:bg-white transition-colors shadow"
                                        aria-label={`Remove ${product.name} from wishlist`}
                                    >
                                        <svg className="w-5 h-5 text-red-500 fill-red-500" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                                        </svg>
                                    </button>
                                </div>
                                <div className="p-4 flex flex-col flex-grow">
                                    <h3 className={`font-semibold ${darkMode ? 'text-light' : 'text-gray-800'} mb-1`}>{product.name}</h3>
                                    <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'} flex-grow mb-3 line-clamp-2`}>{product.description}</p>
                                    <div className="flex justify-between items-center">
                                        {product.discount ? (
                                            <div>
                                                <span className="text-gray-500 line-through text-sm mr-1">${product.price.toFixed(2)}</span>
                                                <span className="text-primary font-bold">${(product.price * (1 - product.discount)).toFixed(2)}</span>
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
