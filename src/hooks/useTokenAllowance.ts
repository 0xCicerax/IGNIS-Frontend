import { useState, useCallback } from 'react';
import type { Token, Address } from '../types';
import { TIMING } from '../constants';

interface ApproveResult {
    success: boolean;
    hash?: string;
    error?: string;
}

interface UseTokenAllowanceResult {
    allowance: bigint;
    isApproving: boolean;
    isLoading: boolean;
    needsApproval: (amount: number) => boolean;
    approve: (amount: number, infinite?: boolean) => Promise<ApproveResult>;
    isNativeToken: boolean;
}

export function useTokenAllowance(
    token: Token | null,
    spender: Address | undefined,
    isConnected: boolean
): UseTokenAllowanceResult {
    const [allowance, setAllowance] = useState<bigint>(BigInt(0));
    const [isApproving, setIsApproving] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const isNativeToken = token?.isNative ?? false;

    const needsApproval = useCallback((amount: number): boolean => {
        if (!token || isNativeToken || !isConnected) return false;
        const amountBigInt = BigInt(Math.floor(amount * Math.pow(10, token.decimals)));
        return amountBigInt > allowance;
    }, [token, isNativeToken, isConnected, allowance]);

    const approve = useCallback(async (amount: number, infinite: boolean = true): Promise<ApproveResult> => {
        if (!token || !isConnected) {
            return { success: false, error: 'Not connected' };
        }
        
        setIsApproving(true);
        
        try {
            // Simulate approval transaction
            await new Promise(resolve => setTimeout(resolve, TIMING.TX_SIMULATION));
            
            // Set approval amount
            if (infinite) {
                setAllowance(BigInt(2) ** BigInt(256) - BigInt(1));
            } else {
                setAllowance(BigInt(Math.floor(amount * Math.pow(10, token.decimals))));
            }
            
            const hash = '0x' + Math.random().toString(16).slice(2, 10) + Math.random().toString(16).slice(2, 10);
            setIsApproving(false);
            return { success: true, hash };
        } catch (error: unknown) {
            setIsApproving(false);
            return { success: false, error: error instanceof Error ? error.message : 'Approval failed' };
        }
    }, [token, isConnected]);

    return { allowance, isApproving, isLoading, needsApproval, approve, isNativeToken };
}
