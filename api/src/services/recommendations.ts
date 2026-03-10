import { Product } from '../models/product';
import { WishlistItem } from '../models/wishlist';

interface ScoredProduct extends Product {
    relevanceScore: number;
    recommendationReason: string;
}

function getAveragePriceRange(items: WishlistItem[], products: Product[]): { min: number; max: number } {
    const prices = items
        .map(item => products.find(p => p.productId === item.productId)?.price ?? 0)
        .filter(p => p > 0);
    if (prices.length === 0) return { min: 0, max: Infinity };
    const avg = prices.reduce((a, b) => a + b, 0) / prices.length;
    return { min: avg * 0.5, max: avg * 1.5 };
}

function extractKeywords(items: WishlistItem[], products: Product[]): string[] {
    const words = items.flatMap(item => {
        const product = products.find(p => p.productId === item.productId);
        if (!product) return [];
        return (product.name + ' ' + product.description)
            .toLowerCase()
            .split(/\W+/)
            .filter(w => w.length > 4);
    });
    // Return most frequent keywords
    const freq: Record<string, number> = {};
    words.forEach(w => { freq[w] = (freq[w] ?? 0) + 1; });
    return Object.entries(freq)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([word]) => word);
}

function calculateRelevance(
    product: Product,
    supplierIds: number[],
    priceRange: { min: number; max: number },
    keywords: string[]
): { score: number; reason: string } {
    let score = 0;
    const reasons: string[] = [];

    // Same supplier bonus
    if (supplierIds.includes(product.supplierId)) {
        score += 30;
        reasons.push('same supplier');
    }

    // Price range bonus
    if (product.price >= priceRange.min && product.price <= priceRange.max) {
        score += 25;
        reasons.push('similar price range');
    }

    // Keyword match bonus
    const productText = (product.name + ' ' + product.description).toLowerCase();
    const matchedKeywords = keywords.filter(kw => productText.includes(kw));
    score += matchedKeywords.length * 5;
    if (matchedKeywords.length > 0) {
        reasons.push('similar features');
    }

    // Discount bonus
    if (product.discount && product.discount > 0) {
        score += 10;
        reasons.push('currently on sale');
    }

    const reason = reasons.length > 0
        ? `Recommended because: ${reasons.join(', ')}`
        : 'You might also like this';

    return { score, reason };
}

/**
 * Recommendation engine: analyzes wishlist to find relevant products not already in the wishlist.
 * Returns up to 10 products sorted by relevance score.
 */
export function getRecommendations(
    wishlistItems: WishlistItem[],
    allProducts: Product[]
): ScoredProduct[] {
    if (wishlistItems.length === 0) {
        // Return top discounted items when wishlist is empty
        return allProducts
            .filter(p => p.discount && p.discount > 0)
            .slice(0, 10)
            .map(p => ({ ...p, relevanceScore: 50, recommendationReason: 'Currently on sale' }));
    }

    const wishlistProductIds = new Set(wishlistItems.map(item => item.productId));
    const supplierIds = wishlistItems
        .map(item => allProducts.find(p => p.productId === item.productId)?.supplierId ?? 0)
        .filter(id => id > 0);
    const priceRange = getAveragePriceRange(wishlistItems, allProducts);
    const keywords = extractKeywords(wishlistItems, allProducts);

    return allProducts
        .filter(p => !wishlistProductIds.has(p.productId))
        .map(product => {
            const { score, reason } = calculateRelevance(product, supplierIds, priceRange, keywords);
            return {
                ...product,
                relevanceScore: score,
                recommendationReason: reason
            };
        })
        .sort((a, b) => b.relevanceScore - a.relevanceScore)
        .slice(0, 10);
}
