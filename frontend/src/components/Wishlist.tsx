import { useState, useMemo } from 'react';
import { useWishlist } from '../context/WishlistContext';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import WishlistItemCard from './wishlist/WishlistItemCard';
import ShareWishlistModal from './wishlist/ShareWishlistModal';
import RecommendationsSection from './wishlist/RecommendationsSection';
import { toast, Toaster } from 'react-hot-toast';

type SortKey = 'date' | 'price' | 'priority' | 'name';
type FilterPriority = 'all' | 'low' | 'medium' | 'high';

const PRIORITY_ORDER = { high: 0, medium: 1, low: 2 };

export default function Wishlist() {
    const { items, removeItem, updateItem, addItem, shareWishlist, isLoading } = useWishlist();
    const { isLoggedIn } = useAuth();
    const { darkMode } = useTheme();

    const [sortKey, setSortKey] = useState<SortKey>('date');
    const [sortAsc, setSortAsc] = useState(false);
    const [filterPriority, setFilterPriority] = useState<FilterPriority>('all');
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
    const [showShareModal, setShowShareModal] = useState(false);
    const [bulkPriority, setBulkPriority] = useState<'low' | 'medium' | 'high'>('medium');

    const filtered = useMemo(() => {
        let result = [...items];
        if (filterPriority !== 'all') {
            result = result.filter(i => i.priority === filterPriority);
        }
        result.sort((a, b) => {
            let cmp = 0;
            switch (sortKey) {
                case 'date':
                    cmp = new Date(a.addedAt).getTime() - new Date(b.addedAt).getTime();
                    break;
                case 'price':
                    cmp = (a.product?.price ?? 0) - (b.product?.price ?? 0);
                    break;
                case 'priority':
                    cmp = PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority];
                    break;
                case 'name':
                    cmp = (a.product?.name ?? '').localeCompare(b.product?.name ?? '');
                    break;
            }
            return sortAsc ? cmp : -cmp;
        });
        return result;
    }, [items, sortKey, sortAsc, filterPriority]);

    const toggleSort = (key: SortKey) => {
        if (sortKey === key) setSortAsc(prev => !prev);
        else { setSortKey(key); setSortAsc(false); }
    };

    const toggleSelect = (productId: number) => {
        setSelectedIds(prev => {
            const next = new Set(prev);
            if (next.has(productId)) next.delete(productId); else next.add(productId);
            return next;
        });
    };

    const handleSelectAll = () => {
        if (selectedIds.size === filtered.length) {
            setSelectedIds(new Set());
        } else {
            setSelectedIds(new Set(filtered.map(i => i.productId)));
        }
    };

    const handleBulkRemove = async () => {
        const toRemove = [...selectedIds];
        await Promise.all(toRemove.map(id => removeItem(id)));
        setSelectedIds(new Set());
        toast.success(`Removed ${toRemove.length} item${toRemove.length > 1 ? 's' : ''}`);
    };

    const handleBulkPriority = async () => {
        await Promise.all([...selectedIds].map(id => updateItem(id, { priority: bulkPriority })));
        setSelectedIds(new Set());
        toast.success('Priority updated');
    };

    const handleRemoveItem = async (productId: number) => {
        await removeItem(productId);
        setSelectedIds(prev => { const next = new Set(prev); next.delete(productId); return next; });
        toast.success('Removed from wishlist');
    };

    const handleAddToCart = (productId: number) => {
        toast.success(`Added to cart`);
        // TODO: Integrate with cart context
        console.log('Add to cart:', productId);
    };

    const handleExportCSV = () => {
        const header = ['Name', 'SKU', 'Price', 'Priority', 'Notes', 'Added'];
        const rows = items.map(item => [
            item.product?.name ?? '',
            item.product?.sku ?? '',
            item.product?.price?.toFixed(2) ?? '',
            item.priority,
            item.notes ?? '',
            new Date(item.addedAt).toLocaleDateString()
        ]);
        const csv = [header, ...rows].map(row => row.map(v => `"${v}"`).join(',')).join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'wishlist.csv';
        a.click();
        URL.revokeObjectURL(url);
    };

    const handleAddRecommendation = async (productId: number) => {
        try {
            await addItem(productId);
            toast.success('Added to wishlist');
        } catch {
            toast.error('Could not add to wishlist');
        }
    };

    if (!isLoggedIn) {
        return (
            <div className={`min-h-screen ${darkMode ? 'bg-dark' : 'bg-gray-100'} pt-20 px-4 flex items-center justify-center transition-colors`}>
                <div className={`text-center ${darkMode ? 'text-light' : 'text-gray-700'}`}>
                    <div className="text-5xl mb-4">💝</div>
                    <h2 className="text-2xl font-bold mb-2">Your Wishlist</h2>
                    <p className="mb-4">Please log in to view and manage your wishlist.</p>
                    <a href="/login" className="bg-primary hover:bg-accent text-white px-6 py-2 rounded-lg transition-colors inline-block">
                        Log In
                    </a>
                </div>
            </div>
        );
    }

    return (
        <div className={`min-h-screen ${darkMode ? 'bg-dark' : 'bg-gray-100'} pt-20 pb-16 px-4 transition-colors duration-300`}>
            <Toaster position="top-right" />
            <div className="max-w-7xl mx-auto">
                {/* Page header */}
                <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
                    <h1 className={`text-3xl font-bold ${darkMode ? 'text-light' : 'text-gray-800'}`}>
                        My Wishlist
                        {items.length > 0 && (
                            <span className={`ml-2 text-lg font-normal ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                ({items.length} {items.length === 1 ? 'item' : 'items'})
                            </span>
                        )}
                    </h1>
                    <div className="flex gap-2 flex-wrap">
                        <button
                            onClick={() => setShowShareModal(true)}
                            className="flex items-center gap-1 bg-primary hover:bg-accent text-white px-4 py-2 rounded-lg text-sm transition-colors"
                            aria-label="Share wishlist"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                            </svg>
                            Share
                        </button>
                        <button
                            onClick={handleExportCSV}
                            className={`flex items-center gap-1 px-4 py-2 rounded-lg text-sm transition-colors ${darkMode ? 'bg-gray-700 text-light hover:bg-gray-600' : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'}`}
                            aria-label="Export wishlist as CSV"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                            </svg>
                            Export CSV
                        </button>
                    </div>
                </div>

                {isLoading ? (
                    <div className="flex justify-center items-center h-40">
                        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
                    </div>
                ) : items.length === 0 ? (
                    <div className={`text-center py-16 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                        <div className="text-5xl mb-4">🛒</div>
                        <p className="text-xl">Your wishlist is empty</p>
                        <p className="text-sm mt-2">Browse products and click the heart icon to add items</p>
                        <a href="/products" className="mt-4 inline-block bg-primary hover:bg-accent text-white px-6 py-2 rounded-lg transition-colors">
                            Browse Products
                        </a>
                    </div>
                ) : (
                    <>
                        {/* Controls bar */}
                        <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg p-3 mb-4 flex flex-wrap gap-3 items-center transition-colors`}>
                            {/* Priority filter */}
                            <div className="flex gap-1">
                                {(['all', 'high', 'medium', 'low'] as FilterPriority[]).map(p => (
                                    <button
                                        key={p}
                                        onClick={() => setFilterPriority(p)}
                                        className={`text-xs px-3 py-1 rounded-full capitalize transition-colors ${
                                            filterPriority === p
                                                ? 'bg-primary text-white'
                                                : `${darkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`
                                        }`}
                                        aria-pressed={filterPriority === p}
                                        aria-label={`Filter by ${p} priority`}
                                    >
                                        {p === 'all' ? 'All' : `${p} priority`}
                                    </button>
                                ))}
                            </div>

                            <div className="flex-grow" />

                            {/* Sort controls */}
                            <div className="flex items-center gap-1 text-xs">
                                <span className={darkMode ? 'text-gray-400' : 'text-gray-500'}>Sort:</span>
                                {(['date', 'price', 'priority', 'name'] as SortKey[]).map(key => (
                                    <button
                                        key={key}
                                        onClick={() => toggleSort(key)}
                                        className={`px-2 py-1 rounded capitalize transition-colors flex items-center gap-0.5 ${
                                            sortKey === key
                                                ? 'bg-primary text-white'
                                                : `${darkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`
                                        }`}
                                        aria-label={`Sort by ${key}`}
                                    >
                                        {key}
                                        {sortKey === key && (
                                            <span aria-hidden="true">{sortAsc ? ' ↑' : ' ↓'}</span>
                                        )}
                                    </button>
                                ))}
                            </div>

                            {/* View mode toggle */}
                            <div className={`flex rounded-lg overflow-hidden border ${darkMode ? 'border-gray-600' : 'border-gray-200'}`}>
                                <button
                                    onClick={() => setViewMode('grid')}
                                    className={`p-1.5 transition-colors ${viewMode === 'grid' ? 'bg-primary text-white' : (darkMode ? 'bg-gray-700 text-gray-400' : 'bg-white text-gray-500')}`}
                                    aria-pressed={viewMode === 'grid'}
                                    aria-label="Grid view"
                                >
                                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                        <path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM11 13a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                                    </svg>
                                </button>
                                <button
                                    onClick={() => setViewMode('list')}
                                    className={`p-1.5 transition-colors ${viewMode === 'list' ? 'bg-primary text-white' : (darkMode ? 'bg-gray-700 text-gray-400' : 'bg-white text-gray-500')}`}
                                    aria-pressed={viewMode === 'list'}
                                    aria-label="List view"
                                >
                                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                                    </svg>
                                </button>
                            </div>
                        </div>

                        {/* Bulk actions bar */}
                        {selectedIds.size > 0 && (
                            <div className={`${darkMode ? 'bg-gray-700' : 'bg-blue-50'} rounded-lg p-3 mb-4 flex flex-wrap items-center gap-3 text-sm`}>
                                <span className={`font-medium ${darkMode ? 'text-light' : 'text-gray-700'}`}>
                                    {selectedIds.size} selected
                                </span>
                                <button onClick={handleBulkRemove} className="text-red-500 hover:text-red-700 font-medium transition-colors" aria-label="Remove selected items">
                                    Remove Selected
                                </button>
                                <div className="flex items-center gap-2">
                                    <span className={darkMode ? 'text-gray-400' : 'text-gray-500'}>Set priority:</span>
                                    <select
                                        value={bulkPriority}
                                        onChange={e => setBulkPriority(e.target.value as 'low' | 'medium' | 'high')}
                                        className={`text-xs rounded px-2 py-1 border ${darkMode ? 'bg-gray-600 text-light border-gray-500' : 'bg-white border-gray-300'} focus:outline-none`}
                                        aria-label="Select bulk priority"
                                    >
                                        <option value="low">Low</option>
                                        <option value="medium">Medium</option>
                                        <option value="high">High</option>
                                    </select>
                                    <button onClick={handleBulkPriority} className="bg-primary text-white px-2 py-1 rounded text-xs hover:bg-accent transition-colors" aria-label="Apply bulk priority">
                                        Apply
                                    </button>
                                </div>
                                <button
                                    onClick={() => setSelectedIds(new Set())}
                                    className={`ml-auto text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'} hover:text-primary transition-colors`}
                                    aria-label="Deselect all items"
                                >
                                    Clear selection
                                </button>
                            </div>
                        )}

                        {/* Select all */}
                        <div className="flex items-center gap-2 mb-3">
                            <button
                                onClick={handleSelectAll}
                                className={`text-xs ${darkMode ? 'text-gray-400 hover:text-light' : 'text-gray-500 hover:text-gray-700'} transition-colors`}
                                aria-label={selectedIds.size === filtered.length ? 'Deselect all' : 'Select all'}
                            >
                                {selectedIds.size === filtered.length && filtered.length > 0 ? 'Deselect all' : 'Select all'}
                            </button>
                            <span className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                                · Showing {filtered.length} of {items.length}
                            </span>
                        </div>

                        {/* Items grid/list */}
                        <div className={
                            viewMode === 'grid'
                                ? 'grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4'
                                : 'flex flex-col gap-3'
                        }>
                            {filtered.map(item => (
                                <WishlistItemCard
                                    key={item.wishlistId}
                                    item={item}
                                    isSelected={selectedIds.has(item.productId)}
                                    onToggleSelect={toggleSelect}
                                    onRemove={handleRemoveItem}
                                    onUpdate={updateItem}
                                    onAddToCart={handleAddToCart}
                                />
                            ))}
                        </div>

                        {filtered.length === 0 && (
                            <div className={`text-center py-10 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                No items match the selected filter.
                            </div>
                        )}

                        {/* AI Recommendations */}
                        <RecommendationsSection onAddToWishlist={handleAddRecommendation} />
                    </>
                )}
            </div>

            {showShareModal && (
                <ShareWishlistModal
                    onClose={() => setShowShareModal(false)}
                    onShare={shareWishlist}
                />
            )}
        </div>
    );
}
