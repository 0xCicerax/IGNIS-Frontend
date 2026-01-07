import { useState, useEffect } from 'react';
import type { ProtocolStats, ChartDataPoint } from '../types';
import { TIMING } from '../constants';

interface UseAnalyticsResult {
    stats: ProtocolStats | null;
    tvlHistory: ChartDataPoint[];
    volumeHistory: ChartDataPoint[];
    isLoading: boolean;
    error: Error | null;
}

const generateMockHistory = (baseValue: number, days: number = 30): ChartDataPoint[] => {
    const data: ChartDataPoint[] = [];
    let value = baseValue * 0.7;
    
    for (let i = days; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        value *= (0.98 + Math.random() * 0.06);
        data.push({
            date: date.toISOString().split('T')[0],
            value: Math.round(value),
        });
    }
    
    return data;
};

export function useAnalytics(): UseAnalyticsResult {
    const [stats, setStats] = useState<ProtocolStats | null>(null);
    const [tvlHistory, setTvlHistory] = useState<ChartDataPoint[]>([]);
    const [volumeHistory, setVolumeHistory] = useState<ChartDataPoint[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        const loadAnalytics = async (): Promise<void> => {
            try {
                setIsLoading(true);
                
                // Simulate API call
                await new Promise(resolve => setTimeout(resolve, TIMING.LOADING_DELAY));
                
                setStats({
                    tvl: 185000000,
                    volume24h: 42500000,
                    volume7d: 285000000,
                    fees24h: 127500,
                    uniqueUsers: 12500,
                    totalPools: 45,
                    totalTransactions: 158000,
                });
                
                setTvlHistory(generateMockHistory(185000000));
                setVolumeHistory(generateMockHistory(42500000));
                setIsLoading(false);
            } catch (err: unknown) {
                setError(err instanceof Error ? err : new Error('Failed to load analytics'));
                setIsLoading(false);
            }
        };

        loadAnalytics();
    }, []);

    return { stats, tvlHistory, volumeHistory, isLoading, error };
}
