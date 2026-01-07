import type { Pool, PoolType } from '../types';
import { TOKENS } from './tokens';

const getToken = (symbol: string) => TOKENS.find(t => t.symbol === symbol)!;

export const POOLS: Pool[] = [
    // Standard pools
    { id: '1', token0: getToken('ETH'), token1: getToken('USDC'), type: 'CLAMM', fee: 0.30, tvl: 25000000, volume24h: 8500000, apr: 18.5, aprFees: 12.5, aprEmissions: 6.0 },
    { id: '2', token0: getToken('ETH'), token1: getToken('USDT'), type: 'CLAMM', fee: 0.30, tvl: 18000000, volume24h: 5200000, apr: 15.2, aprFees: 10.2, aprEmissions: 5.0 },
    { id: '3', token0: getToken('USDC'), token1: getToken('USDT'), type: 'CLAMM', fee: 0.01, tvl: 45000000, volume24h: 12000000, apr: 8.5, aprFees: 8.5 },
    { id: '4', token0: getToken('ETH'), token1: getToken('DAI'), type: 'LBAMM', fee: 0.25, tvl: 8500000, volume24h: 2100000, apr: 22.1, aprFees: 14.1, aprEmissions: 8.0 },
    { id: '5', token0: getToken('IGNIS'), token1: getToken('ETH'), type: 'CLAMM', fee: 0.30, tvl: 4200000, volume24h: 890000, apr: 45.5, aprFees: 15.5, aprEmissions: 30.0 },
    
    // Yield-bearing pools
    { id: '6', token0: getToken('stETH'), token1: getToken('ETH'), type: 'CLAMM', fee: 0.05, tvl: 35000000, volume24h: 4500000, apr: 24.8, aprFees: 6.5, aprYield: 3.8, aprEmissions: 14.5, isYieldBearing: true, platforms: ['Lido'], routesTo: 'ETH/USDC' },
    { id: '7', token0: getToken('aUSDC'), token1: getToken('USDC'), type: 'CLAMM', fee: 0.01, tvl: 28000000, volume24h: 6200000, apr: 12.5, aprFees: 3.5, aprYield: 4.2, aprEmissions: 4.8, isYieldBearing: true, platforms: ['Aave'], routesTo: 'USDC/USDT' },
    { id: '8', token0: getToken('rETH'), token1: getToken('WETH'), type: 'LBAMM', fee: 0.10, tvl: 15000000, volume24h: 2800000, apr: 19.2, aprFees: 8.5, aprYield: 3.2, aprEmissions: 7.5, isYieldBearing: true, platforms: ['Rocket Pool'] },
    { id: '9', token0: getToken('sDAI'), token1: getToken('DAI'), type: 'CLAMM', fee: 0.01, tvl: 22000000, volume24h: 3100000, apr: 14.8, aprFees: 4.2, aprYield: 5.0, aprEmissions: 5.6, isYieldBearing: true, platforms: ['Spark'], routesTo: 'DAI/USDC' },
    { id: '10', token0: getToken('cbETH'), token1: getToken('ETH'), type: 'CLAMM', fee: 0.05, tvl: 18500000, volume24h: 2200000, apr: 16.5, aprFees: 5.8, aprYield: 3.5, aprEmissions: 7.2, isYieldBearing: true, platforms: ['Coinbase'] },
];

export const getPoolById = (id: string): Pool | undefined => {
    return POOLS.find(p => p.id === id);
};

export const getYieldBearingPools = (): Pool[] => {
    return POOLS.filter(p => p.isYieldBearing);
};

export const getPoolsByType = (type: PoolType): Pool[] => {
    return POOLS.filter(p => p.type === type);
};
