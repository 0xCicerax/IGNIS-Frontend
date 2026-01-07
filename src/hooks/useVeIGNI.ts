import { useCallback, useState } from 'react';
import type { UserLock } from '../types/veIGNI';
import { useWallet } from '../contexts';

const MIN_LOCK_AMOUNT = BigInt('1000000000000000000');

const MOCK_LOCKS: UserLock[] = [
    {
        id: '1',
        tokenId: BigInt(1),
        lockedAmount: 5000,
        lockedAmountRaw: BigInt('5000000000000000000000'),
        votingPower: 4250,
        votingPowerRaw: BigInt('4250000000000000000000'),
        initialVotingPower: 5000,
        multiplier: '0.85x',
        unlockDate: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000),
        isPerma: false,
        progress: 15,
        hasVoted: false,
    },
    {
        id: '2',
        tokenId: BigInt(2),
        lockedAmount: 10000,
        lockedAmountRaw: BigInt('10000000000000000000000'),
        votingPower: 10000,
        votingPowerRaw: BigInt('10000000000000000000000'),
        initialVotingPower: 10000,
        multiplier: '1.0x',
        unlockDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        isPerma: true,
        progress: 0,
        hasVoted: false,
    },
];

type HexAddress = `0x${string}`;

interface UseSplitOptions {
    contractAddress: HexAddress;
    onSuccess?: (newTokenId: bigint, txHash: HexAddress) => void;
    onError?: (error: Error) => void;
}

export function useVeIGNISplit({ onSuccess, onError }: UseSplitOptions) {
    const [isPending, setIsPending] = useState(false);
    const [isConfirming, setIsConfirming] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [hash, setHash] = useState<HexAddress | undefined>();
    const [error, setError] = useState<Error | null>(null);

    const split = useCallback(
        async (tokenId: bigint, amount: bigint) => {
            if (amount < MIN_LOCK_AMOUNT) {
                const err = new Error('Split amount must be at least 1 token');
                setError(err);
                onError?.(err);
                return;
            }
            setIsPending(true);
            setError(null);
            await new Promise(resolve => setTimeout(resolve, 1500));
            const mockHash = ('0x' + Math.random().toString(16).slice(2) + Math.random().toString(16).slice(2)) as HexAddress;
            setHash(mockHash);
            setIsPending(false);
            setIsConfirming(true);
            await new Promise(resolve => setTimeout(resolve, 1000));
            setIsConfirming(false);
            setIsSuccess(true);
            onSuccess?.(BigInt(Date.now()), mockHash);
        },
        [onSuccess, onError]
    );

    const splitByRatio = useCallback(
        async (tokenId: bigint, lockedAmount: bigint, ratioPercent: number) => {
            if (ratioPercent < 10 || ratioPercent > 90) {
                throw new Error('Ratio must be between 10% and 90%');
            }
            const splitAmount = (lockedAmount * BigInt(ratioPercent)) / BigInt(100);
            return split(tokenId, splitAmount);
        },
        [split]
    );

    const reset = useCallback(() => {
        setIsPending(false);
        setIsConfirming(false);
        setIsSuccess(false);
        setHash(undefined);
        setError(null);
    }, []);

    return { split, splitByRatio, hash, isPending, isConfirming, isSuccess, error, reset };
}

interface UseMergeOptions {
    contractAddress: HexAddress;
    onSuccess?: (targetTokenId: bigint, txHash: HexAddress) => void;
    onError?: (error: Error) => void;
}

export function useVeIGNIMerge({ onSuccess, onError }: UseMergeOptions) {
    const [isPending, setIsPending] = useState(false);
    const [isConfirming, setIsConfirming] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [hash, setHash] = useState<HexAddress | undefined>();
    const [error, setError] = useState<Error | null>(null);

    const merge = useCallback(
        async (fromId: bigint, toId: bigint) => {
            if (fromId === toId) {
                const err = new Error('Cannot merge a token with itself');
                setError(err);
                onError?.(err);
                return;
            }
            setIsPending(true);
            setError(null);
            await new Promise(resolve => setTimeout(resolve, 1500));
            const mockHash = ('0x' + Math.random().toString(16).slice(2) + Math.random().toString(16).slice(2)) as HexAddress;
            setHash(mockHash);
            setIsPending(false);
            setIsConfirming(true);
            await new Promise(resolve => setTimeout(resolve, 1000));
            setIsConfirming(false);
            setIsSuccess(true);
            onSuccess?.(toId, mockHash);
        },
        [onSuccess, onError]
    );

    const mergeMultiple = useCallback(
        async (tokenIds: bigint[]) => {
            if (tokenIds.length < 2) throw new Error('Need at least 2 tokens to merge');
            const targetId = tokenIds[0];
            for (let i = 1; i < tokenIds.length; i++) {
                await merge(tokenIds[i], targetId);
            }
        },
        [merge]
    );

    const reset = useCallback(() => {
        setIsPending(false);
        setIsConfirming(false);
        setIsSuccess(false);
        setHash(undefined);
        setError(null);
    }, []);

    return { merge, mergeMultiple, hash, isPending, isConfirming, isSuccess, error, reset };
}

interface UseLocksOptions {
    contractAddress: HexAddress;
    decimals?: number;
}

export function useVeIGNILocks(_options: UseLocksOptions) {
    const { isConnected } = useWallet();
    const refetch = useCallback(() => {}, []);
    return {
        locks: isConnected ? MOCK_LOCKS : [],
        isLoading: false,
        refetch,
    };
}

export function useVeIGNIVotedStatus(_contractAddress: HexAddress, _tokenId: bigint | undefined) {
    return false;
}

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
    if (target.isPerma) return { valid: true };
    const hasPermaSource = locks.some((l, i) => i !== targetIndex && l.isPerma);
    if (hasPermaSource) {
        return { valid: false, error: 'Cannot merge permanent locks into a timed lock.' };
    }
    return { valid: true };
}
