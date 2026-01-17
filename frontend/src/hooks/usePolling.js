import { useState, useEffect, useCallback, useRef } from 'react';

const POLLING_INTERVAL = parseInt(import.meta.env.VITE_POLLING_INTERVAL) || 15000;

/**
 * Custom hook for polling API data
 * @param {Function} fetchFn - Async function to fetch data
 * @param {Object} deps - Dependencies that trigger refetch
 * @param {boolean} enabled - Whether polling is enabled
 */
export function usePolling(fetchFn, deps = {}, enabled = true) {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [lastUpdated, setLastUpdated] = useState(null);
    const intervalRef = useRef(null);
    const mountedRef = useRef(true);

    const fetchData = useCallback(async () => {
        try {
            const result = await fetchFn();
            if (mountedRef.current) {
                setData(result.data);
                setError(null);
                setLastUpdated(new Date());
            }
        } catch (err) {
            if (mountedRef.current) {
                setError(err.response?.data?.error || 'Veri alınamadı');
                console.error('Polling error:', err);
            }
        } finally {
            if (mountedRef.current) {
                setLoading(false);
            }
        }
    }, [fetchFn]);

    const refresh = useCallback(() => {
        setLoading(true);
        fetchData();
    }, [fetchData]);

    useEffect(() => {
        mountedRef.current = true;

        if (enabled) {
            setLoading(true);
            fetchData();

            intervalRef.current = setInterval(fetchData, POLLING_INTERVAL);
        }

        return () => {
            mountedRef.current = false;
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
        };
    }, [fetchData, enabled, JSON.stringify(deps)]);

    return { data, loading, error, lastUpdated, refresh };
}

/**
 * Format number as Turkish currency
 */
export function formatCurrency(value) {
    if (value === null || value === undefined) return '-';
    return new Intl.NumberFormat('tr-TR', {
        style: 'currency',
        currency: 'TRY',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(value);
}

/**
 * Format number with Turkish locale
 */
export function formatNumber(value, decimals = 0) {
    if (value === null || value === undefined) return '-';
    return new Intl.NumberFormat('tr-TR', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
    }).format(value);
}

/**
 * Format percentage
 */
export function formatPercent(value) {
    if (value === null || value === undefined) return '-';
    return `%${formatNumber(value, 1)}`;
}

/**
 * Format date in Turkish locale
 */
export function formatDate(date) {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('tr-TR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });
}

/**
 * Format time in Turkish locale
 */
export function formatTime(date) {
    if (!date) return '-';
    return new Date(date).toLocaleTimeString('tr-TR', {
        hour: '2-digit',
        minute: '2-digit',
    });
}

/**
 * Get risk level color
 */
export function getRiskColor(score) {
    if (score >= 70) return 'var(--danger-500)';
    if (score >= 40) return 'var(--warning-500)';
    return 'var(--success-500)';
}

/**
 * Get risk level class
 */
export function getRiskClass(score) {
    if (score >= 70) return 'danger';
    if (score >= 40) return 'warning';
    return 'success';
}

/**
 * Get profit/loss color
 */
export function getProfitColor(value) {
    if (value > 0) return 'var(--success-500)';
    if (value < 0) return 'var(--danger-500)';
    return 'var(--gray-500)';
}

/**
 * Month names in Turkish
 */
export const MONTHS_TR = [
    'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
    'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'
];

/**
 * Category translations
 */
export const CATEGORY_NAMES = {
    'Books': 'Kitaplar',
    'Stationery': 'Kırtasiye',
    'Kids': 'Çocuk',
    'Gifts': 'Hediyeler',
    'OnlineOrders': 'Online Siparişler'
};

/**
 * Expense type translations
 */
export const EXPENSE_TYPES = {
    'Rent': 'Kira',
    'Salary': 'Maaş',
    'Utilities': 'Faturalar',
    'Marketing': 'Pazarlama',
    'Inventory': 'Stok',
    'Maintenance': 'Bakım',
    'Other': 'Diğer'
};
