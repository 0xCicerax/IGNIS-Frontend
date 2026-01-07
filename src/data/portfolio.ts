import type { Token } from '../types';
import { TOKENS } from './tokens';
import { POOLS } from './pools';

// ─────────────────────────────────────────────────────────────────────────────
// USER POSITIONS (LP)
// ─────────────────────────────────────────────────────────────────────────────
export interface UserPosition {
    id: string;
    pool: typeof POOLS[0];
    token0Amount: number;
    token1Amount: number;
    minPrice: number;
    maxPrice: number;
    inRange: boolean;
    feesEarned: number;
    igniEarned: number;
    createdAt: Date;
    initialValue: number;
}

export const USER_POSITIONS: UserPosition[] = [
    { 
        id: '1', 
        pool: POOLS[0], 
        token0Amount: 1.5, 
        token1Amount: 3675, 
        minPrice: 2100, 
        maxPrice: 2800, 
        inRange: true, 
        feesEarned: 245.20, 
        igniEarned: 85.5,
        createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        initialValue: 6800,
    },
    { 
        id: '2', 
        pool: POOLS[5], 
        token0Amount: 2.0, 
        token1Amount: 2.0, 
        minPrice: 0.98, 
        maxPrice: 1.02, 
        inRange: true, 
        feesEarned: 128.50, 
        igniEarned: 42.3,
        createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
        initialValue: 9500,
    },
    { 
        id: '3', 
        pool: POOLS[6], 
        token0Amount: 5000, 
        token1Amount: 5000, 
        minPrice: 0.999, 
        maxPrice: 1.001, 
        inRange: true, 
        feesEarned: 315.80, 
        igniEarned: 0,
        createdAt: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000),
        initialValue: 9800,
    },
    { 
        id: '4', 
        pool: POOLS[4], 
        token0Amount: 2500, 
        token1Amount: 0.85, 
        minPrice: 0.0003, 
        maxPrice: 0.0005, 
        inRange: false, 
        feesEarned: 425.40, 
        igniEarned: 156.2,
        createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
        initialValue: 3800,
    },
];

// ─────────────────────────────────────────────────────────────────────────────
// USER LOCKS (veIGNIS)
// ─────────────────────────────────────────────────────────────────────────────
export interface UserLock {
    id: string;
    lockedIgni: number;
    veIgni: number;
    initialVeIgni: number;
    multiplier: string;
    unlockDate: Date;
    isPerma: boolean;
    progress: number;
}

export const USER_LOCKS: UserLock[] = [
    { 
        id: '1', 
        lockedIgni: 5000, 
        veIgni: 4800, 
        initialVeIgni: 5000, 
        multiplier: '1.0x', 
        unlockDate: new Date('2025-12-31'), 
        isPerma: false, 
        progress: 25 
    },
    { 
        id: '2', 
        lockedIgni: 2500, 
        veIgni: 2500, 
        initialVeIgni: 2500, 
        multiplier: '1.0x', 
        unlockDate: new Date('2099-12-31'), 
        isPerma: true, 
        progress: 0 
    },
    { 
        id: '3', 
        lockedIgni: 1000, 
        veIgni: 650, 
        initialVeIgni: 1000, 
        multiplier: '0.65x', 
        unlockDate: new Date('2025-06-15'), 
        isPerma: false, 
        progress: 65 
    },
];

// ─────────────────────────────────────────────────────────────────────────────
// PORTFOLIO HISTORY (for charts)
// ─────────────────────────────────────────────────────────────────────────────
export interface PortfolioHistoryPoint {
    date: string;
    totalValue: number;
    walletValue: number;
    lpValue: number;
    stakingValue: number;
}

const generatePortfolioHistory = (days: number = 30): PortfolioHistoryPoint[] => {
    const history: PortfolioHistoryPoint[] = [];
    let totalValue = 42000;
    
    for (let i = days; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        
        // Add some realistic volatility
        const dailyChange = (Math.random() - 0.48) * 0.03; // Slight upward bias
        totalValue *= (1 + dailyChange);
        
        const walletPct = 0.35 + (Math.random() * 0.05);
        const lpPct = 0.45 + (Math.random() * 0.05);
        const stakingPct = 1 - walletPct - lpPct;
        
        history.push({
            date: date.toISOString().split('T')[0],
            totalValue: Math.round(totalValue),
            walletValue: Math.round(totalValue * walletPct),
            lpValue: Math.round(totalValue * lpPct),
            stakingValue: Math.round(totalValue * stakingPct),
        });
    }
    
    return history;
};

export const PORTFOLIO_HISTORY = generatePortfolioHistory(30);

// ─────────────────────────────────────────────────────────────────────────────
// RECENT ACTIVITY
// ─────────────────────────────────────────────────────────────────────────────
export interface ActivityItem {
    id: string;
    type: 'swap' | 'add_liquidity' | 'remove_liquidity' | 'stake' | 'claim' | 'receive';
    title: string;
    description: string;
    value: string;
    timestamp: Date;
    txHash: string;
}

export const RECENT_ACTIVITY: ActivityItem[] = [
    {
        id: '1',
        type: 'claim',
        title: 'Claimed Rewards',
        description: 'veIGNIS staking rewards',
        value: '+45.25 IGNIS',
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
        txHash: '0x1234...5678',
    },
    {
        id: '2',
        type: 'swap',
        title: 'Swap',
        description: '1.5 ETH → 3,675 USDC',
        value: '$3,675.00',
        timestamp: new Date(Date.now() - 8 * 60 * 60 * 1000),
        txHash: '0x2345...6789',
    },
    {
        id: '3',
        type: 'add_liquidity',
        title: 'Added Liquidity',
        description: 'ETH/USDC Pool',
        value: '+$5,250.00',
        timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000),
        txHash: '0x3456...7890',
    },
    {
        id: '4',
        type: 'stake',
        title: 'Locked IGNIS',
        description: '5,000 IGNIS → 5,000 veIGNIS',
        value: '$10,000.00',
        timestamp: new Date(Date.now() - 48 * 60 * 60 * 1000),
        txHash: '0x4567...8901',
    },
    {
        id: '5',
        type: 'receive',
        title: 'Received',
        description: 'From 0x8a2f...3e4b',
        value: '+2.0 ETH',
        timestamp: new Date(Date.now() - 72 * 60 * 60 * 1000),
        txHash: '0x5678...9012',
    },
];

// ─────────────────────────────────────────────────────────────────────────────
// HELPER FUNCTIONS
// ─────────────────────────────────────────────────────────────────────────────
export const getWalletValue = (): number => {
    return TOKENS.reduce((sum, token) => sum + (token.balance * token.price), 0);
};

export const getLPValue = (): number => {
    return USER_POSITIONS.reduce((sum, pos) => {
        return sum + (pos.token0Amount * pos.pool.token0.price) + (pos.token1Amount * pos.pool.token1.price);
    }, 0);
};

export const getStakingValue = (): number => {
    const igniPrice = 2.00; // Mock price
    return USER_LOCKS.reduce((sum, lock) => sum + (lock.lockedIgni * igniPrice), 0);
};

export const getTotalPortfolioValue = (): number => {
    return getWalletValue() + getLPValue() + getStakingValue();
};

export const getUnclaimedRewards = (): { fees: number; ignis: number } => {
    const fees = USER_POSITIONS.reduce((sum, pos) => sum + pos.feesEarned, 0);
    const ignis = USER_POSITIONS.reduce((sum, pos) => sum + pos.igniEarned, 0);
    return { fees, ignis };
};

export const get24hChange = (): { value: number; percent: number } => {
    if (PORTFOLIO_HISTORY.length < 2) return { value: 0, percent: 0 };
    const current = PORTFOLIO_HISTORY[PORTFOLIO_HISTORY.length - 1].totalValue;
    const yesterday = PORTFOLIO_HISTORY[PORTFOLIO_HISTORY.length - 2].totalValue;
    const change = current - yesterday;
    const percent = (change / yesterday) * 100;
    return { value: change, percent };
};

export const get7dChange = (): { value: number; percent: number } => {
    if (PORTFOLIO_HISTORY.length < 8) return { value: 0, percent: 0 };
    const current = PORTFOLIO_HISTORY[PORTFOLIO_HISTORY.length - 1].totalValue;
    const weekAgo = PORTFOLIO_HISTORY[PORTFOLIO_HISTORY.length - 8].totalValue;
    const change = current - weekAgo;
    const percent = (change / weekAgo) * 100;
    return { value: change, percent };
};
