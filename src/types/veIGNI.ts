import type { ReactNode } from 'react';

// ─────────────────────────────────────────────────────────────────────────────
// VOTING ESCROW TYPES
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Raw locked balance from contract
 */
export interface LockedBalance {
    amount: bigint;
    end: bigint;
    isPermanent: boolean;
}

/**
 * Parsed user lock for UI display
 */
export interface UserLock {
    id: string;
    tokenId: bigint;
    lockedAmount: number;       // Parsed from bigint, in token units
    lockedAmountRaw: bigint;    // Raw amount for contract calls
    votingPower: number;        // Current veIGNIS power
    votingPowerRaw: bigint;
    initialVotingPower: number;
    multiplier: string;
    unlockDate: Date;
    isPerma: boolean;
    progress: number;           // 0-100, decay progress
    hasVoted: boolean;          // Cannot split/merge if true
}

/**
 * Token configuration for the modal
 */
export interface TokenConfig {
    baseToken: string;
    votingToken: string;
    decimals: number;
    icon?: ReactNode;
}

/**
 * Contract addresses
 */
export interface ContractAddresses {
    votingEscrow: `0x${string}`;
    token: `0x${string}`;
}

// ─────────────────────────────────────────────────────────────────────────────
// HOOK TYPES
// ─────────────────────────────────────────────────────────────────────────────

export interface UseSplitParams {
    tokenId: bigint;
    amount: bigint;     // Absolute amount to split off (not ratio)
}

export interface UseMergeParams {
    fromId: bigint;
    toId: bigint;
}

export interface SplitResult {
    originalTokenId: bigint;
    newTokenId: bigint;
    txHash: `0x${string}`;
}

export interface MergeResult {
    targetTokenId: bigint;
    mergedTokenIds: bigint[];
    txHash: `0x${string}`;
}

// ─────────────────────────────────────────────────────────────────────────────
// MODAL PROPS
// ─────────────────────────────────────────────────────────────────────────────

export interface SplitMergeModalProps {
    isOpen: boolean;
    onClose: () => void;
    locks: UserLock[];
    tokens: TokenConfig;
    contractAddress: `0x${string}`;
    onSuccess?: () => void;
    formatNumber?: (num: number) => string;
}

// ─────────────────────────────────────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────────────────────────────────────

export const MIN_LOCK_AMOUNT = BigInt('1000000000000000000'); // 1e18 = 1 token

export const TOKEN_CONFIGS = {
    IGNIS: {
        baseToken: 'IGNIS',
        votingToken: 'veIGNIS',
        decimals: 18,
    },
    YLD: {
        baseToken: 'YLD',
        votingToken: 'veYLD',
        decimals: 18,
    },
} as const;
