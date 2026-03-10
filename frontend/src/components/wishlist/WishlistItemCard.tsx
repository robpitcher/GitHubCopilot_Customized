import { useState } from 'react';
import { WishlistItem } from '../../context/WishlistContext';
import { useTheme } from '../../context/ThemeContext';

interface WishlistItemCardProps {
    item: WishlistItem;
    isSelected: boolean;
    onToggleSelect: (productId: number) => void;
    onRemove: (productId: number) => void;
    onUpdate: (productId: number, updates: Partial<WishlistItem>) => Promise<void>;
    onAddToCart: (productId: number) => void;
}

const PRIORITY_COLORS = {
    low: 'bg-blue-100 text-blue-800',
    medium: 'bg-yellow-100 text-yellow-800',
    high: 'bg-red-100 text-red-800'
};

export default function WishlistItemCard({
    item,
    isSelected,
    onToggleSelect,
    onRemove,
    onUpdate,
    onAddToCart
}: WishlistItemCardProps) {
    const { darkMode } = useTheme();
    const [editingNotes, setEditingNotes] = useState(false);
    const [notesValue, setNotesValue] = useState(item.notes ?? '');
    const [saving, setSaving] = useState(false);

    const product = item.product;
    if (!product) return null;

    const currentPrice = product.discount
        ? product.price * (1 - product.discount)
        : product.price;

    const priceDrop = item.priceWhenAdded > 0
        ? ((item.priceWhenAdded - currentPrice) / item.priceWhenAdded) * 100
        : 0;
    const hasPriceDrop = priceDrop >= 5;

    const handleSaveNotes = async () => {
        setSaving(true);
        try {
            await onUpdate(item.productId, { notes: notesValue });
            setEditingNotes(false);
        } finally {
            setSaving(false);
        }
    };

    const handlePriorityChange = async (priority: 'low' | 'medium' | 'high') => {
        await onUpdate(item.productId, { priority });
    };

    const handleToggleAlert = async (field: 'notifyOnPriceDrop' | 'notifyOnStock') => {
        await onUpdate(item.productId, { [field]: !item[field] });
    };

    return (
        <div className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border rounded-lg p-4 flex flex-col gap-3 transition-colors duration-300 ${isSelected ? 'ring-2 ring-primary' : ''}`}>
            {/* Header: checkbox + image + name */}
            <div className="flex items-start gap-3">
                <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => onToggleSelect(item.productId)}
                    className="mt-1 accent-primary"
                    aria-label={`Select ${product.name}`}
                />
                <img
                    src={`/${product.imgName}`}
                    alt={product.name}
                    className="w-16 h-16 object-contain rounded-md bg-gray-100"
                />
                <div className="flex-1 min-w-0">
                    <h3 className={`font-semibold truncate ${darkMode ? 'text-light' : 'text-gray-800'}`}>
                        {product.name}
                    </h3>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                        {/* Price */}
                        <span className="text-primary font-bold">${currentPrice.toFixed(2)}</span>
                        {product.discount && (
                            <span className={`text-sm line-through ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                ${product.price.toFixed(2)}
                            </span>
                        )}
                        {/* Price drop badge */}
                        {hasPriceDrop && (
                            <span className="bg-green-100 text-green-800 text-xs font-semibold px-2 py-0.5 rounded-full">
                                ↓ {priceDrop.toFixed(0)}% drop
                            </span>
                        )}
                    </div>
                </div>
            </div>

            {/* Priority selector */}
            <div className="flex items-center gap-2">
                <span className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Priority:</span>
                {(['low', 'medium', 'high'] as const).map(p => (
                    <button
                        key={p}
                        onClick={() => handlePriorityChange(p)}
                        className={`text-xs px-2 py-0.5 rounded-full capitalize transition-all ${
                            item.priority === p
                                ? PRIORITY_COLORS[p] + ' font-semibold'
                                : `${darkMode ? 'bg-gray-700 text-gray-400' : 'bg-gray-100 text-gray-500'} hover:opacity-80`
                        }`}
                        aria-pressed={item.priority === p}
                        aria-label={`Set priority to ${p}`}
                    >
                        {p}
                    </button>
                ))}
            </div>

            {/* Alert toggles */}
            <div className="flex gap-4 text-xs">
                <label className={`flex items-center gap-1 cursor-pointer ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                    <input
                        type="checkbox"
                        checked={item.notifyOnPriceDrop}
                        onChange={() => handleToggleAlert('notifyOnPriceDrop')}
                        className="accent-primary"
                        aria-label="Notify on price drop"
                    />
                    Price alerts
                </label>
                <label className={`flex items-center gap-1 cursor-pointer ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                    <input
                        type="checkbox"
                        checked={item.notifyOnStock}
                        onChange={() => handleToggleAlert('notifyOnStock')}
                        className="accent-primary"
                        aria-label="Notify on stock"
                    />
                    Stock alerts
                </label>
            </div>

            {/* Personal notes */}
            <div>
                {editingNotes ? (
                    <div className="flex gap-2">
                        <textarea
                            value={notesValue}
                            onChange={e => setNotesValue(e.target.value)}
                            rows={2}
                            maxLength={500}
                            placeholder="Add a personal note..."
                            className={`flex-1 text-sm rounded px-2 py-1 border ${darkMode ? 'bg-gray-700 text-light border-gray-600' : 'bg-gray-50 text-gray-800 border-gray-300'} focus:outline-none focus:border-primary`}
                            aria-label="Personal notes"
                        />
                        <div className="flex flex-col gap-1">
                            <button
                                onClick={handleSaveNotes}
                                disabled={saving}
                                className="text-xs bg-primary text-white px-2 py-1 rounded hover:bg-accent transition-colors disabled:opacity-50"
                                aria-label="Save notes"
                            >
                                Save
                            </button>
                            <button
                                onClick={() => { setEditingNotes(false); setNotesValue(item.notes ?? ''); }}
                                className={`text-xs px-2 py-1 rounded ${darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-600'} hover:opacity-80 transition-colors`}
                                aria-label="Cancel editing notes"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                ) : (
                    <button
                        onClick={() => setEditingNotes(true)}
                        className={`w-full text-left text-xs italic ${item.notes ? (darkMode ? 'text-gray-300' : 'text-gray-600') : (darkMode ? 'text-gray-500' : 'text-gray-400')} hover:text-primary transition-colors`}
                        aria-label={item.notes ? 'Edit notes' : 'Add notes'}
                    >
                        {item.notes || '+ Add a note...'}
                    </button>
                )}
            </div>

            {/* Action buttons */}
            <div className="flex gap-2 pt-1">
                <button
                    onClick={() => onAddToCart(item.productId)}
                    className="flex-1 bg-primary hover:bg-accent text-white text-sm py-1.5 rounded-lg transition-colors"
                    aria-label={`Add ${product.name} to cart`}
                >
                    Add to Cart
                </button>
                <button
                    onClick={() => onRemove(item.productId)}
                    className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${darkMode ? 'bg-gray-700 text-red-400 hover:bg-red-900/30' : 'bg-gray-100 text-red-500 hover:bg-red-50'}`}
                    aria-label={`Remove ${product.name} from wishlist`}
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                </button>
            </div>
        </div>
    );
}
