/**
 * Format a number as currency
 */
export function formatCurrency(value: number | undefined | null, decimals: number = 2): string {
    if (value == null || isNaN(value)) return '$0.00';
    if (value >= 1e9) {
        return `$${(value / 1e9).toFixed(2)}B`;
    }
    if (value >= 1e6) {
        return `$${(value / 1e6).toFixed(2)}M`;
    }
    if (value >= 1e3) {
        return `$${(value / 1e3).toFixed(2)}K`;
    }
    return `$${value.toFixed(decimals)}`;
}

/**
 * Format a number with K/M/B suffix
 */
export function formatNumber(value: number | undefined | null, decimals: number = 2): string {
    if (value == null || isNaN(value)) return '0';
    if (value >= 1e9) {
        return `${(value / 1e9).toFixed(decimals)}B`;
    }
    if (value >= 1e6) {
        return `${(value / 1e6).toFixed(decimals)}M`;
    }
    if (value >= 1e3) {
        return `${(value / 1e3).toFixed(decimals)}K`;
    }
    return value.toFixed(decimals);
}

/**
 * Format a percentage
 */
export function formatPercent(value: number | undefined | null, decimals: number = 2): string {
    if (value == null || isNaN(value)) return '0.00%';
    return `${value.toFixed(decimals)}%`;
}

/**
 * Format an address for display (0x1234...5678)
 */
export function formatAddress(address: string, chars: number = 4): string {
    if (!address) return '';
    return `${address.slice(0, chars + 2)}...${address.slice(-chars)}`;
}

/**
 * Format token amount with proper decimals
 */
export function formatTokenAmount(
    amount: bigint | string | number,
    decimals: number,
    displayDecimals: number = 4
): string {
    const value = typeof amount === 'bigint' 
        ? Number(amount) / Math.pow(10, decimals)
        : typeof amount === 'string' 
            ? parseFloat(amount)
            : amount;
    
    return value.toLocaleString(undefined, {
        minimumFractionDigits: 0,
        maximumFractionDigits: displayDecimals,
    });
}
