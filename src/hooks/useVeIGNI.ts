import { useCallback, useMemo } from 'react';
import {
    useWriteContract,
    useWaitForTransactionReceipt,
    useReadContract,
    useReadContracts,
    useAccount,
} from 'wagmi';
import type { UserLock } from '../types/veIGNI';

// ─────────────────────────────────────────────────────────────────────────────
// ABI FRAGMENTS
// ─────────────────────────────────────────────────────────────────────────────

const VOTING_ESCROW_ABI = [
    {
        type: 'function',
        name: 'split',
        inputs: [
            { name: 'tokenId', type: 'uint256' },
            { name: 'amount', type: 'uint256' },
        ],
        outputs: [{ name: 'newTokenId', type: 'uint256' }],
        stateMutability: 'nonpayable',
    },
    {
        type: 'function',
        name: 'merge',
        inputs: [
            { name: 'fromId', type: 'uint256' },
            { name: 'toId', type: 'uint256' },
        ],
        outputs: [],
        stateMutability: 'nonpayable',
    },
    {
        type: 'function',
        name: 'locked',
        inputs: [{ name: 'tokenId', type: 'uint256' }],
        outputs: [
            {
                name: '',
                type: 'tuple',
                components: [
                    { name: 'amount', type: 'int128' },
                    { name: 'end', type: 'uint256' },
                    { name: 'isPermanent', type: 'bool' },
                ],
            },
        ],
        stateMutability: 'view',
    },
    {
        type: 'function',
        name: 'balanceOfNFT',
        inputs: [{ name: 'tokenId', type: 'uint256' }],
        outputs: [{ name: '', type: 'uint256' }],
        stateMutability: 'view',
    },
    {
        type: 'function',
        name: 'voted',
        inputs: [{ name: 'tokenId', type: 'uint256' }],
        outputs: [{ name: '', type: 'bool' }],
        stateMutability: 'view',
    },
    {
        type: 'function',
        name: 'balanceOf',
        inputs: [{ name: 'owner', type: 'address' }],
        outputs: [{ name: '', type: 'uint256' }],
        stateMutability: 'view',
    },
    {
        type: 'function',
        name: 'tokenOfOwnerByIndex',
        inputs: [
            { name: 'owner', type: 'address' },
            { name: 'index', type: 'uint256' },
        ],
        outputs: [{ name: '', type: 'uint256' }],
        stateMutability: 'view',
    },
] as const;

// ─────────────────────────────────────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────────────────────────────────────

const MIN_LOCK_AMOUNT = BigInt('1000000000000000000'); // 1e18
const MAX_LOCK_TIME = 4 * 365 * 24 * 60 * 60; // 4 years in seconds

// ─────────────────────────────────────────────────────────────────────────────
// useVeIGNISplit
// ─────────────────────────────────────────────────────────────────────────────

interface UseSplitOptions {
    contractAddress: `0x${string}`;
    onSuccess?: (newTokenId: bigint, txHash: `0x${string}`) => void;
    onError?: (error: Error) => void;
}

export function useVeIGNISplit({ contractAddress, onSuccess, onError }: UseSplitOptions) {
    const { writeContract, data: hash, isPending, error, reset } = useWriteContract();

    const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
        hash,
    });

    const split = useCallback(
        async (tokenId: bigint, amount: bigint) => {
            // Validate minimum amounts
            if (amount < MIN_LOCK_AMOUNT) {
                throw new Error(`Split amount must be at least ${MIN_LOCK_AMOUNT.toString()} (1 token)`);
            }

            try {
                writeContract({
                    address: contractAddress,
                    abi: VOTING_ESCROW_ABI,
                    functionName: 'split',
                    args: [tokenId, amount],
                });
            } catch (err) {
                onError?.(err instanceof Error ? err : new Error('Split failed'));
                throw err;
            }
        },
        [contractAddress, writeContract, onError]
    );

    /**
     * Split by ratio (percentage)
     * @param tokenId - Token to split
     * @param lockedAmount - Total locked amount in the token
     * @param ratioPercent - Percentage to split off (10-90)
     */
    const splitByRatio = useCallback(
        async (tokenId: bigint, lockedAmount: bigint, ratioPercent: number) => {
            if (ratioPercent < 10 || ratioPercent > 90) {
                throw new Error('Ratio must be between 10% and 90%');
            }

            // Calculate the amount to split off based on the ratio
            // The ratio represents what goes into the NEW token
            const splitAmount = (lockedAmount * BigInt(ratioPercent)) / BigInt(100);
            const remainingAmount = lockedAmount - splitAmount;

            // Validate both resulting amounts meet minimum
            if (splitAmount < MIN_LOCK_AMOUNT) {
                throw new Error(`Split amount (${ratioPercent}%) is below minimum lock amount`);
            }
            if (remainingAmount < MIN_LOCK_AMOUNT) {
                throw new Error(`Remaining amount (${100 - ratioPercent}%) is below minimum lock amount`);
            }

            return split(tokenId, splitAmount);
        },
        [split]
    );

    return {
        split,
        splitByRatio,
        hash,
        isPending,
        isConfirming,
        isSuccess,
        error,
        reset,
    };
}

// ─────────────────────────────────────────────────────────────────────────────
// useVeIGNIMerge
// ─────────────────────────────────────────────────────────────────────────────

interface UseMergeOptions {
    contractAddress: `0x${string}`;
    onSuccess?: (targetTokenId: bigint, txHash: `0x${string}`) => void;
    onError?: (error: Error) => void;
}

export function useVeIGNIMerge({ contractAddress, onSuccess, onError }: UseMergeOptions) {
    const { writeContract, data: hash, isPending, error, reset } = useWriteContract();

    const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
        hash,
    });

    /**
     * Merge two tokens (fromId is burned into toId)
     */
    const merge = useCallback(
        async (fromId: bigint, toId: bigint) => {
            if (fromId === toId) {
                throw new Error('Cannot merge a token with itself');
            }

            try {
                writeContract({
                    address: contractAddress,
                    abi: VOTING_ESCROW_ABI,
                    functionName: 'merge',
                    args: [fromId, toId],
                });
            } catch (err) {
                onError?.(err instanceof Error ? err : new Error('Merge failed'));
                throw err;
            }
        },
        [contractAddress, writeContract, onError]
    );

    /**
     * Merge multiple tokens into the first one
     * Note: This requires sequential transactions
     * @param tokenIds - Array of token IDs to merge (first one is the target)
     */
    const mergeMultiple = useCallback(
        async (tokenIds: bigint[]) => {
            if (tokenIds.length < 2) {
                throw new Error('Need at least 2 tokens to merge');
            }

            const targetId = tokenIds[0];

            // Merge each subsequent token into the target
            // Note: In production, you'd want to batch these or use a multicall
            for (let i = 1; i < tokenIds.length; i++) {
                await merge(tokenIds[i], targetId);
            }
        },
        [merge]
    );

    return {
        merge,
        mergeMultiple,
        hash,
        isPending,
        isConfirming,
        isSuccess,
        error,
        reset,
    };
}

// ─────────────────────────────────────────────────────────────────────────────
// useVeIGNILocks
// ─────────────────────────────────────────────────────────────────────────────

interface UseLocksOptions {
    contractAddress: `0x${string}`;
    decimals?: number;
}

export function useVeIGNILocks({ contractAddress, decimals = 18 }: UseLocksOptions) {
    const { address } = useAccount();

    // Get number of NFTs owned
    const { data: balance } = useReadContract({
        address: contractAddress,
        abi: VOTING_ESCROW_ABI,
        functionName: 'balanceOf',
        args: address ? [address] : undefined,
        query: { enabled: !!address },
    });

    // Get token IDs for each index
    const tokenIdCalls = useMemo(() => {
        if (!address || !balance) return [];
        const count = Number(balance);
        return Array.from({ length: count }, (_, i) => ({
            address: contractAddress,
            abi: VOTING_ESCROW_ABI,
            functionName: 'tokenOfOwnerByIndex' as const,
            args: [address, BigInt(i)] as const,
        }));
    }, [address, balance, contractAddress]);

    const { data: tokenIds } = useReadContracts({
        contracts: tokenIdCalls,
        query: { enabled: tokenIdCalls.length > 0 },
    });

    // Get lock data for each token
    const lockDataCalls = useMemo(() => {
        if (!tokenIds) return [];
        return tokenIds
            .filter((t) => t.status === 'success' && t.result)
            .flatMap((t) => {
                const tokenId = t.result as bigint;
                return [
                    {
                        address: contractAddress,
                        abi: VOTING_ESCROW_ABI,
                        functionName: 'locked' as const,
                        args: [tokenId] as const,
                    },
                    {
                        address: contractAddress,
                        abi: VOTING_ESCROW_ABI,
                        functionName: 'balanceOfNFT' as const,
                        args: [tokenId] as const,
                    },
                    {
                        address: contractAddress,
                        abi: VOTING_ESCROW_ABI,
                        functionName: 'voted' as const,
                        args: [tokenId] as const,
                    },
                ];
            });
    }, [tokenIds, contractAddress]);

    const { data: lockData, refetch } = useReadContracts({
        contracts: lockDataCalls,
        query: { enabled: lockDataCalls.length > 0 },
    });

    // Parse into UserLock objects
    const locks = useMemo((): UserLock[] => {
        if (!tokenIds || !lockData) return [];

        const validTokenIds = tokenIds
            .filter((t) => t.status === 'success' && t.result)
            .map((t) => t.result as bigint);

        return validTokenIds.map((tokenId, i) => {
            const baseIndex = i * 3;
            const lockedResult = lockData[baseIndex];
            const balanceResult = lockData[baseIndex + 1];
            const votedResult = lockData[baseIndex + 2];

            const locked = lockedResult?.result as { amount: bigint; end: bigint; isPermanent: boolean } | undefined;
            const votingPowerRaw = (balanceResult?.result as bigint) ?? BigInt(0);
            const hasVoted = (votedResult?.result as boolean) ?? false;

            const amount = locked?.amount ?? BigInt(0);
            const end = locked?.end ?? BigInt(0);
            const isPermanent = locked?.isPermanent ?? false;

            const lockedAmount = Number(amount) / 10 ** decimals;
            const votingPower = Number(votingPowerRaw) / 10 ** decimals;

            // Calculate initial voting power
            // For permanent: initial = locked amount (no decay)
            // For timed: would need original lock duration to calculate properly
            const initialVotingPower = lockedAmount;

            // Calculate decay progress (0 = just locked, 100 = fully decayed)
            const now = Math.floor(Date.now() / 1000);
            const endTime = Number(end);
            let progress = 0;
            if (!isPermanent && endTime > now) {
                // Assuming initial lock was MAX_LOCK_TIME
                const remaining = endTime - now;
                progress = Math.max(0, Math.min(100, 100 - (remaining / MAX_LOCK_TIME) * 100));
            }

            const multiplier = isPermanent
                ? '1.0x'
                : (votingPower > 0 && lockedAmount > 0)
                  ? `${(votingPower / lockedAmount).toFixed(2)}x`
                  : '0x';

            return {
                id: tokenId.toString(),
                tokenId,
                lockedAmount,
                lockedAmountRaw: amount,
                votingPower,
                votingPowerRaw,
                initialVotingPower,
                multiplier,
                unlockDate: new Date(endTime * 1000),
                isPerma: isPermanent,
                progress,
                hasVoted,
            };
        });
    }, [tokenIds, lockData, decimals]);

    return {
        locks,
        isLoading: !tokenIds || !lockData,
        refetch,
    };
}

// ─────────────────────────────────────────────────────────────────────────────
// useVeIGNIVotedStatus
// ─────────────────────────────────────────────────────────────────────────────

export function useVeIGNIVotedStatus(contractAddress: `0x${string}`, tokenId: bigint | undefined) {
    const { data: hasVoted } = useReadContract({
        address: contractAddress,
        abi: VOTING_ESCROW_ABI,
        functionName: 'voted',
        args: tokenId ? [tokenId] : undefined,
        query: { enabled: !!tokenId },
    });

    return hasVoted ?? false;
}

// ─────────────────────────────────────────────────────────────────────────────
// VALIDATION HELPERS
// ─────────────────────────────────────────────────────────────────────────────

export function validateSplit(
    lockedAmount: bigint,
    splitAmount: bigint
): { valid: boolean; error?: string } {
    if (splitAmount < MIN_LOCK_AMOUNT) {
        return { valid: false, error: 'Split amount below minimum (1 token)' };
    }

    const remaining = lockedAmount - splitAmount;
    if (remaining < MIN_LOCK_AMOUNT) {
        return { valid: false, error: 'Remaining amount below minimum (1 token)' };
    }

    if (splitAmount >= lockedAmount) {
        return { valid: false, error: 'Cannot split entire amount' };
    }

    return { valid: true };
}

export function validateMerge(
    locks: Array<{ isPerma: boolean; hasVoted: boolean }>,
    targetIndex: number = 0
): { valid: boolean; error?: string } {
    if (locks.length < 2) {
        return { valid: false, error: 'Select at least 2 positions to merge' };
    }

    const hasVotedLock = locks.some((l) => l.hasVoted);
    if (hasVotedLock) {
        return { valid: false, error: 'Cannot merge positions that have voted this epoch' };
    }

    const target = locks[targetIndex];
    
    // If target is permanent, any lock type can merge into it (timed upgrades to permanent)
    if (target.isPerma) {
        return { valid: true };
    }
    
    // If target is timed, all locks must be timed (cannot downgrade permanent to timed)
    const hasPermaSource = locks.some((l, i) => i !== targetIndex && l.isPerma);
    if (hasPermaSource) {
        return { 
            valid: false, 
            error: 'Cannot merge permanent locks into a timed lock. Select a permanent lock as the target, or use Unlock Permanent first.' 
        };
    }

    return { valid: true };
}
