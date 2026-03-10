import { useEffect, useState } from 'react';
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import axios from 'axios';
import { api } from '../../api/config';
import { useTheme } from '../../context/ThemeContext';

interface PricePoint {
    priceHistoryId: number;
    productId: number;
    price: number;
    recordedAt: string;
}

interface PriceHistoryChartProps {
    productId: number;
    currentPrice: number;
}

export default function PriceHistoryChart({ productId, currentPrice }: PriceHistoryChartProps) {
    const { darkMode } = useTheme();
    const [history, setHistory] = useState<PricePoint[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        axios.get(`${api.baseURL}${api.endpoints.products}/${productId}/price-history`)
            .then(res => setHistory(res.data))
            .catch(() => setHistory([]))
            .finally(() => setLoading(false));
    }, [productId]);

    if (loading) {
        return (
            <div className="h-24 flex items-center justify-center">
                <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-primary"></div>
            </div>
        );
    }

    if (history.length === 0) {
        return (
            <p className={`text-xs text-center py-4 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                No price history available
            </p>
        );
    }

    // Add current price as the latest data point
    const chartData = [
        ...history.map(h => ({
            date: new Date(h.recordedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
            price: h.price,
            isCurrent: false
        })),
        {
            date: 'Now',
            price: currentPrice,
            isCurrent: true
        }
    ];

    const prices = chartData.map(d => d.price);
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);

    return (
        <div>
            <h3 className={`text-sm font-semibold mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                Price History
            </h3>
            <ResponsiveContainer width="100%" height={120}>
                <LineChart data={chartData} margin={{ top: 4, right: 8, left: -16, bottom: 4 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#374151' : '#e5e7eb'} />
                    <XAxis
                        dataKey="date"
                        tick={{ fontSize: 10, fill: darkMode ? '#9ca3af' : '#6b7280' }}
                        tickLine={false}
                    />
                    <YAxis
                        domain={[Math.floor(minPrice * 0.95), Math.ceil(maxPrice * 1.05)]}
                        tick={{ fontSize: 10, fill: darkMode ? '#9ca3af' : '#6b7280' }}
                        tickLine={false}
                        tickFormatter={v => `$${v}`}
                    />
                    <Tooltip
                        formatter={(value) => {
                            if (typeof value !== 'number') return [`${value}`, 'Price'];
                            return [`$${value.toFixed(2)}`, 'Price'];
                        }}
                        contentStyle={{
                            backgroundColor: darkMode ? '#1f2937' : '#ffffff',
                            border: `1px solid ${darkMode ? '#374151' : '#e5e7eb'}`,
                            borderRadius: '6px',
                            fontSize: '12px',
                            color: darkMode ? '#f9fafb' : '#111827'
                        }}
                    />
                    <Line
                        type="monotone"
                        dataKey="price"
                        stroke="#76B852"
                        strokeWidth={2}
                        dot={(props: any) => {
                            const { cx, cy, payload } = props;
                            return payload.isCurrent ? (
                                <circle key={`dot-${cx}-${cy}`} cx={cx} cy={cy} r={5} fill="#76B852" stroke="white" strokeWidth={2} />
                            ) : (
                                <circle key={`dot-${cx}-${cy}`} cx={cx} cy={cy} r={3} fill="#76B852" />
                            );
                        }}
                    />
                </LineChart>
            </ResponsiveContainer>
            <p className={`text-xs text-right mt-1 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                Current: <span className="text-primary font-medium">${currentPrice.toFixed(2)}</span>
            </p>
        </div>
    );
}
