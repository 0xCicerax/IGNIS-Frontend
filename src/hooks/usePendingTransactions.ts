import { useState, useCallback } from 'react';
import type { Transaction, TxStatus, TxType, PendingTransactions } from '../types';

export const TX_STATUS: Record<string, TxStatus> = {
    PENDING: 'pending',
    SUCCESS: 'success',
    FAILED: 'failed',
};

export const TX_TYPES: Record<TxType, string> = {
    swap: 'Swap',
    approve: 'Approve',
    addLiquidity: 'Add Liquidity',
    removeLiquidity: 'Remove Liquidity',
    stake: 'Stake',
    unstake: 'Unstake',
    claim: 'Claim Rewards',
};

export function formatTimeAgo(timestamp: number): string {
    const seconds = Math.floor((Date.now() - timestamp) / 1000);
    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
}

export function getExplorerUrl(hash: string, chainId: number = 8453): string {
    const explorers: Record<number, string> = {
        8453: 'https://basescan.org',
        84532: 'https://sepolia.basescan.org',
        56: 'https://bscscan.com',
        97: 'https://testnet.bscscan.com',
    };
    const explorer = explorers[chainId] || 'https://basescan.org';
    return `${explorer}/tx/${hash}`;
}

export function usePendingTransactions(): PendingTransactions {
    const [transactions, setTransactions] = useState<Transaction[]>([]);

    const addTx = useCallback((tx: Omit<Transaction, 'id' | 'timestamp'>): string => {
        const id = Math.random().toString(36).substring(2, 9);
        const newTx: Transaction = {
            ...tx,
            id,
            timestamp: Date.now(),
        };
        setTransactions(prev => [newTx, ...prev]);
        return id;
    }, []);

    const updateTx = useCallback((id: string, updates: Partial<Transaction>): void => {
        setTransactions(prev =>
            prev.map(tx => (tx.id === id ? { ...tx, ...updates } : tx))
        );
    }, []);

    const removeTx = useCallback((id: string): void => {
        setTransactions(prev => prev.filter(tx => tx.id !== id));
    }, []);

    const clearAll = useCallback((): void => {
        setTransactions([]);
    }, []);

    const clearCompleted = useCallback((): void => {
        setTransactions(prev => prev.filter(tx => tx.status === 'pending'));
    }, []);

    // Aliases for page compatibility
    const addTransaction = addTx;
    const confirmTransaction = useCallback((id: string, hash: string): void => {
        updateTx(id, { status: 'success', hash });
    }, [updateTx]);
    const failTransaction = useCallback((id: string, error: string): void => {
        updateTx(id, { status: 'failed', error });
    }, [updateTx]);

    const pendingCount = transactions.filter(tx => tx.status === 'pending').length;

    return {
        transactions,
        pendingCount,
        addTx,
        updateTx,
        removeTx,
        clearAll,
        clearCompleted,
        // Aliases
        addTransaction,
        confirmTransaction,
        failTransaction,
    };
}
