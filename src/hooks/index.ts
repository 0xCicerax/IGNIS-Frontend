export { usePendingTransactions, TX_STATUS, TX_TYPES, formatTimeAgo, getExplorerUrl } from './usePendingTransactions';
export { useSettings } from './useSettings';
export { useValidation, useInputValidation, validateSwap, calculatePriceImpact } from './useValidation';
export { useAnalytics } from './useAnalytics';
export { useContracts } from './useContracts';
export { useTokenAllowance } from './useTokenAllowance';
export { useDepth } from './useDepth';
export { useSwapQuote } from './useSwapQuote';
export { 
    useKeyboardShortcuts, 
    useGlobalShortcuts, 
    useModalShortcuts,
    useSwapShortcuts,
    KEYBOARD_SHORTCUTS 
} from './useKeyboardShortcuts';

// veIGNI hooks (split/merge)
export {
    useVeIGNISplit,
    useVeIGNIMerge,
    useVeIGNILocks,
    useVeIGNIVotedStatus,
    validateSplit,
    validateMerge,
} from './useVeIGNI';

// Subgraph hooks
export * from './subgraph';

// Contract hooks
export * from './contracts';
