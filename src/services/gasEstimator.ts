import { logger } from '../utils/logger';
import { withRetry, retryPatterns } from '../utils/retry';
// ─────────────────────────────────────────────────────────────────────────────
// GAS ESTIMATOR SERVICE
// ─────────────────────────────────────────────────────────────────────────────
// Estimates gas costs for transactions on Base L2
// Data sources:
// - Gas units: Static estimates per transaction type
// - Gas price: RPC eth_gasPrice (or mock)
// - ETH price: From token data

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────
export interface GasEstimate {
    gasUnits: number;
    gasPriceGwei: number;
    gasCostETH: number;
    gasCostUSD: number;
    l1DataFee?: number; // Base L2 specific
    totalCostUSD: number;
}

export type TransactionType = 
    | 'swap'
    | 'swapWithApproval'
    | 'addLiquidity'
    | 'removeLiquidity'
    | 'stake'
    | 'unstake'
    | 'claim'
    | 'approve'
    | 'wrapETH'
    | 'unwrapETH';

// ─────────────────────────────────────────────────────────────────────────────
// GAS UNITS BY TRANSACTION TYPE
// ─────────────────────────────────────────────────────────────────────────────
// These are approximate values based on typical Base L2 transactions
const GAS_UNITS: Record<TransactionType, number> = {
    swap: 150_000,
    swapWithApproval: 200_000,
    addLiquidity: 250_000,
    removeLiquidity: 200_000,
    stake: 120_000,
    unstake: 150_000,
    claim: 80_000,
    approve: 46_000,
    wrapETH: 30_000,
    unwrapETH: 30_000,
};

// ─────────────────────────────────────────────────────────────────────────────
// MOCK GAS PRICE (replace with RPC call in production)
// ─────────────────────────────────────────────────────────────────────────────
// Base L2 has very low gas prices, typically 0.001-0.01 gwei
const MOCK_GAS_PRICE_GWEI = 0.005; // 0.005 gwei is typical for Base
const MOCK_ETH_PRICE_USD = 2450; // Replace with live price

// Base L2 data fee (for posting data to L1)
// This is typically the larger cost component on L2s
const MOCK_L1_DATA_FEE_USD = 0.01; // ~$0.01 for L1 data

// ─────────────────────────────────────────────────────────────────────────────
// MAIN ESTIMATOR FUNCTION
// ─────────────────────────────────────────────────────────────────────────────
export const estimateGas = (
    txType: TransactionType,
    ethPriceUSD: number = MOCK_ETH_PRICE_USD,
    gasPriceGwei: number = MOCK_GAS_PRICE_GWEI
): GasEstimate => {
    const gasUnits = GAS_UNITS[txType];
    
    // Calculate L2 execution cost
    const gasCostETH = (gasUnits * gasPriceGwei) / 1e9;
    const gasCostUSD = gasCostETH * ethPriceUSD;
    
    // Add L1 data fee (Base specific)
    const l1DataFee = MOCK_L1_DATA_FEE_USD;
    
    // Total cost
    const totalCostUSD = gasCostUSD + l1DataFee;
    
    return {
        gasUnits,
        gasPriceGwei,
        gasCostETH,
        gasCostUSD,
        l1DataFee,
        totalCostUSD,
    };
};

// ─────────────────────────────────────────────────────────────────────────────
// FORMATTED OUTPUT
// ─────────────────────────────────────────────────────────────────────────────
export const formatGasEstimate = (estimate: GasEstimate): string => {
    if (estimate.totalCostUSD < 0.01) {
        return '<$0.01';
    }
    return `~$${estimate.totalCostUSD.toFixed(2)}`;
};

export const formatGasEstimateDetailed = (estimate: GasEstimate): {
    total: string;
    breakdown: { label: string; value: string }[];
} => {
    return {
        total: formatGasEstimate(estimate),
        breakdown: [
            { label: 'L2 Execution', value: `$${estimate.gasCostUSD.toFixed(4)}` },
            { label: 'L1 Data Fee', value: `$${(estimate.l1DataFee || 0).toFixed(4)}` },
            { label: 'Gas Units', value: estimate.gasUnits.toLocaleString() },
            { label: 'Gas Price', value: `${estimate.gasPriceGwei.toFixed(4)} gwei` },
        ],
    };
};

// ─────────────────────────────────────────────────────────────────────────────
// QUICK ESTIMATE HELPERS
// ─────────────────────────────────────────────────────────────────────────────
export const getSwapGasEstimate = (needsApproval: boolean, ethPrice?: number): GasEstimate => {
    return estimateGas(needsApproval ? 'swapWithApproval' : 'swap', ethPrice);
};

export const getAddLiquidityGasEstimate = (ethPrice?: number): GasEstimate => {
    return estimateGas('addLiquidity', ethPrice);
};

export const getRemoveLiquidityGasEstimate = (ethPrice?: number): GasEstimate => {
    return estimateGas('removeLiquidity', ethPrice);
};

export const getStakeGasEstimate = (ethPrice?: number): GasEstimate => {
    return estimateGas('stake', ethPrice);
};

export const getClaimGasEstimate = (ethPrice?: number): GasEstimate => {
    return estimateGas('claim', ethPrice);
};

// ─────────────────────────────────────────────────────────────────────────────
// LIVE GAS PRICE FETCHER (for production) with retry
// ─────────────────────────────────────────────────────────────────────────────
export const fetchGasPrice = async (rpcUrl: string): Promise<number> => {
    try {
        const gasPriceGwei = await withRetry(async () => {
            const response = await fetch(rpcUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    jsonrpc: '2.0',
                    method: 'eth_gasPrice',
                    params: [],
                    id: 1,
                }),
            });
            
            if (!response.ok) {
                throw new Error(`RPC error: ${response.status}`);
            }
            
            const data = await response.json();
            const gasPriceWei = parseInt(data.result, 16);
            return gasPriceWei / 1e9;
        }, retryPatterns.rpc);
        
        return gasPriceGwei;
    } catch (error: unknown) {
        logger.warn('Gas price fetch failed, using default', { error: error instanceof Error ? error.message : error });
        return MOCK_GAS_PRICE_GWEI;
    }
};

export default {
    estimateGas,
    formatGasEstimate,
    formatGasEstimateDetailed,
    getSwapGasEstimate,
    getAddLiquidityGasEstimate,
    getRemoveLiquidityGasEstimate,
    getStakeGasEstimate,
    getClaimGasEstimate,
    fetchGasPrice,
};
