import type { Position } from '../types';
import { POOLS } from './pools';

export const POSITIONS: Position[] = [
    { id: '1', pool: POOLS[0], token0Amount: 1.5, token1Amount: 3675, minPrice: 2100, maxPrice: 2800, status: 'active', unclaimedFees: 45.20, unclaimedYield: 12.50 },
    { id: '2', pool: POOLS[5], token0Amount: 2.0, token1Amount: 2.0, minPrice: 0.98, maxPrice: 1.02, status: 'active', unclaimedFees: 28.50, unclaimedYield: 18.40 },
    { id: '3', pool: POOLS[6], token0Amount: 5000, token1Amount: 5000, minPrice: 0.999, maxPrice: 1.001, status: 'active', unclaimedFees: 15.80, unclaimedYield: 8.20 },
    { id: '4', pool: POOLS[4], token0Amount: 2500, token1Amount: 0.85, minPrice: 0.0003, maxPrice: 0.0005, status: 'active', unclaimedFees: 125.40 },
];

export const getActivePositions = (): Position[] => {
    return POSITIONS.filter(p => p.status === 'active');
};

export const getPositionsByPool = (poolId: string): Position[] => {
    return POSITIONS.filter(p => p.pool.id === poolId);
};
