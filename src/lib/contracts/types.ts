/** Module */

import { Address } from 'viem';

// ─────────────────────────────────────────────────────────────────────────────────
// QUOTER TYPES (AureliaSmartQuoterV5)
// ─────────────────────────────────────────────────────────────────────────────────

/**
 * Action types for route steps
 * Matches: ACTION_SWAP_CL, ACTION_SWAP_BIN, ACTION_WRAP, ACTION_UNWRAP
 */
export const RouteAction = {
  SWAP_CL: 0,
  SWAP_BIN: 1,
  WRAP: 2,
  UNWRAP: 3,
} as const;

export type RouteActionType = (typeof RouteAction)[keyof typeof RouteAction];

/**
 * Single step in a swap route
 * Matches: struct RouteStep in AureliaSmartQuoterV5.sol
 */
export interface RouteStep {
  action: number;       // uint8: RouteAction type
  tokenIn: Address;     // address
  tokenOut: Address;    // address
  amountIn: bigint;     // uint256
  amountOut: bigint;    // uint256
  poolData: `0x${string}`; // bytes: Pool-specific data
}

/**
 * Complete quote result from the smart quoter
 * Matches: struct QuoteResult in AureliaSmartQuoterV5.sol
 */
export interface QuoteResult {
  amountOut: bigint;           // uint256: Expected output amount
  gasEstimate: bigint;         // uint256: Estimated gas cost
  priceImpactBps: bigint;      // uint256: Price impact in basis points
  quotedAt: bigint;            // uint256: Timestamp of quote
  quotedBlock: bigint;         // uint256: Block number of quote
  route: RouteStep[];          // RouteStep[]: Decoded route steps
  encodedRoute: `0x${string}`; // bytes: Encoded route for execution
  isSplit: boolean;            // bool: Whether route is split
  splitCount: number;          // uint8: Number of split routes
  bufferFee: bigint;           // uint256: Buffer fee in basis points
  isDirectBuffer: boolean;     // bool: Whether using buffer directly
}

/**
 * Params for quoteExactInputSingle (CL pools)
 */
export interface QuoteExactInputSingleParamsCL {
  poolKey: {
    currency0: Address;
    currency1: Address;
    hooks: Address;
    poolManager: Address;
    fee: number;
    parameters: `0x${string}`;
  };
  zeroForOne: boolean;
  exactAmount: bigint;
  hookData: `0x${string}`;
}

// ─────────────────────────────────────────────────────────────────────────────────
// ROUTER TYPES (GatewayRouterV5)
// ─────────────────────────────────────────────────────────────────────────────────

/**
 * Execute route parameters
 * Matches: executeRoute function in GatewayRouterV5.sol
 */
export interface ExecuteRouteParams {
  encodedRoute: `0x${string}`;  // bytes: Encoded route from quoter
  amountIn: bigint;             // uint256: Input amount
  minAmountOut: bigint;         // uint256: Minimum output (slippage protection)
  recipient: Address;            // address: Recipient of output tokens
  deadline: bigint;              // uint256: Transaction deadline timestamp
}

/**
 * Router event types
 */
export interface RouteExecutedEvent {
  sender: Address;
  tokenIn: Address;
  tokenOut: Address;
  amountIn: bigint;
  amountOut: bigint;
  recipient: Address;
}

export interface SplitRouteExecutedEvent {
  sender: Address;
  tokenIn: Address;
  tokenOut: Address;
  amountIn: bigint;
  amountOut: bigint;
  recipient: Address;
  splitCount: number;
}

export interface StepExecutedEvent {
  action: number;
  tokenIn: Address;
  tokenOut: Address;
  amountIn: bigint;
  amountOut: bigint;
  pool: Address;
}

// ─────────────────────────────────────────────────────────────────────────────────
// BUFFER TYPES (Gateway4626Buffer)
// ─────────────────────────────────────────────────────────────────────────────────

/**
 * Buffer state for a vault
 * Matches: getBufferState return values in Gateway4626Buffer.sol
 */
export interface BufferState {
  underlyingBalance: bigint;  // uint256: Current underlying token balance
  sharesBalance: bigint;      // uint256: Current vault share balance
  targetUnderlying: bigint;   // uint256: Target underlying balance
  targetShares: bigint;       // uint256: Target shares balance
}

/**
 * Wrap event
 */
export interface WrappedEvent {
  vault: Address;
  sender: Address;
  recipient: Address;
  underlyingAmount: bigint;
  sharesReceived: bigint;
  usedBuffer: boolean;
}

/**
 * Unwrap event
 */
export interface UnwrappedEvent {
  vault: Address;
  sender: Address;
  recipient: Address;
  sharesBurned: bigint;
  underlyingReceived: bigint;
  usedBuffer: boolean;
}

// ─────────────────────────────────────────────────────────────────────────────────
// STAKER TYPES (BufferStakerV2)
// ─────────────────────────────────────────────────────────────────────────────────

/**
 * Staking pool info
 * Matches: getPool return values in BufferStakerV2.sol
 */
export interface StakingPoolInfo {
  underlying: Address;          // address: Underlying token
  totalStaked: bigint;          // uint256: Total staked amount
  rewardRate: bigint;           // uint256: Rewards per second
  lastUpdateTime: bigint;       // uint256: Last reward update
  rewardPerTokenStored: bigint; // uint256: Accumulated reward per token
  gatewayCount: number;         // uint256: Number of gateways
}

/**
 * Staker position
 */
export interface StakerPosition {
  stakedAmount: bigint;          // uint256: User's staked amount
  rewardPerTokenPaid: bigint;    // uint256: Reward per token at last action
  pendingRewards: bigint;        // uint256: Unclaimed rewards
}

// ─────────────────────────────────────────────────────────────────────────────────
// TOKEN REGISTRY TYPES (TokenRegistryV2)
// ─────────────────────────────────────────────────────────────────────────────────

/**
 * Vault mapping
 */
export interface VaultMapping {
  vault: Address;
  underlying: Address;
  isPrimary: boolean;
  enabled: boolean;
}

// ─────────────────────────────────────────────────────────────────────────────────
// POOL REGISTRY TYPES (PoolRegistry)
// ─────────────────────────────────────────────────────────────────────────────────

/**
 * CL Pool key
 */
export interface CLPoolKey {
  currency0: Address;
  currency1: Address;
  hooks: Address;
  poolManager: Address;
  fee: number;
  parameters: `0x${string}`;
}

/**
 * BIN Pool key
 */
export interface BinPoolKey {
  currency0: Address;
  currency1: Address;
  hooks: Address;
  poolManager: Address;
  binStep: number;
  parameters: `0x${string}`;
}

// ─────────────────────────────────────────────────────────────────────────────────
// COMMON TYPES
// ─────────────────────────────────────────────────────────────────────────────────

/**
 * Token approval state
 */
export interface TokenApproval {
  token: Address;
  spender: Address;
  allowance: bigint;
  isApproved: boolean;
}

/**
 * Transaction state
 */
export type TransactionStatus = 
  | 'idle'
  | 'preparing'
  | 'awaiting_approval'
  | 'approving'
  | 'awaiting_signature'
  | 'pending'
  | 'confirming'
  | 'success'
  | 'failed'
  | 'rejected';

/**
 * Generic transaction result
 */
export interface TransactionResult {
  hash: `0x${string}`;
  status: TransactionStatus;
  confirmations: number;
  blockNumber?: bigint;
  gasUsed?: bigint;
  effectiveGasPrice?: bigint;
}

// ─────────────────────────────────────────────────────────────────────────────────
// ERROR TYPES
// ─────────────────────────────────────────────────────────────────────────────────

/**
 * Contract error signatures
 * Used for parsing revert reasons
 */
export const CONTRACT_ERRORS = {
  // Router errors
  AmountTooLarge: 'AmountTooLarge()',
  DeadlineExpired: 'DeadlineExpired()',
  ETHMismatch: 'ETHMismatch()',
  EnforcedPause: 'EnforcedPause()',
  InconsistentInputToken: 'InconsistentInputToken()',
  InconsistentOutputToken: 'InconsistentOutputToken()',
  InsufficientOutput: 'InsufficientOutput()',
  InvalidAddress: 'InvalidAddress()',
  InvalidRoute: 'InvalidRoute()',
  InvalidSplitEncoding: 'InvalidSplitEncoding()',
  InvalidStep: 'InvalidStep()',
  RouteTooLong: 'RouteTooLong()',
  TransferFailed: 'TransferFailed()',
  Unauthorized: 'Unauthorized()',
  WETHMismatch: 'WETHMismatch()',
  ZeroAmount: 'ZeroAmount()',
  
  // Quoter errors
  NoRouteFound: 'NoRouteFound()',
  InvalidToken: 'InvalidToken()',
  MaxRoutingTokensReached: 'MaxRoutingTokensReached()',
  TokenNotFound: 'TokenNotFound()',
  
  // Staker errors
  AllocationMismatch: 'AllocationMismatch()',
  GatewayAlreadyExists: 'GatewayAlreadyExists()',
  GatewayNotFound: 'GatewayNotFound()',
  InsufficientBuffer: 'InsufficientBuffer()',
  InvalidAllocation: 'InvalidAllocation()',
  InvalidBufferTarget: 'InvalidBufferTarget()',
  NothingToPush: 'NothingToPush()',
  NothingToRefill: 'NothingToRefill()',
  PoolAlreadyExists: 'PoolAlreadyExists()',
  PoolNotFound: 'PoolNotFound()',
  ZeroAddress: 'ZeroAddress()',
} as const;

export type ContractErrorName = keyof typeof CONTRACT_ERRORS;

/**
 * User-friendly error messages
 */
export const ERROR_MESSAGES: Record<ContractErrorName, string> = {
  AmountTooLarge: 'Amount exceeds maximum allowed',
  DeadlineExpired: 'Transaction deadline has passed',
  ETHMismatch: 'ETH amount does not match input',
  EnforcedPause: 'Contract is currently paused',
  InconsistentInputToken: 'Input token mismatch in route',
  InconsistentOutputToken: 'Output token mismatch in route',
  InsufficientOutput: 'Output amount less than minimum (try increasing slippage)',
  InvalidAddress: 'Invalid address provided',
  InvalidRoute: 'Invalid swap route',
  InvalidSplitEncoding: 'Split route encoding error',
  InvalidStep: 'Invalid step in route',
  RouteTooLong: 'Route exceeds maximum steps',
  TransferFailed: 'Token transfer failed',
  Unauthorized: 'Not authorized to perform this action',
  WETHMismatch: 'WETH address mismatch',
  ZeroAmount: 'Amount cannot be zero',
  NoRouteFound: 'No valid route found between tokens',
  InvalidToken: 'Token is not supported',
  MaxRoutingTokensReached: 'Maximum routing tokens exceeded',
  TokenNotFound: 'Token not found in registry',
  AllocationMismatch: 'Gateway allocation does not sum to 100%',
  GatewayAlreadyExists: 'Gateway already registered',
  GatewayNotFound: 'Gateway not found',
  InsufficientBuffer: 'Buffer has insufficient liquidity',
  InvalidAllocation: 'Invalid allocation percentage',
  InvalidBufferTarget: 'Invalid buffer target configuration',
  NothingToPush: 'No excess buffer to push',
  NothingToRefill: 'Buffer does not need refill',
  PoolAlreadyExists: 'Staking pool already exists',
  PoolNotFound: 'Staking pool not found',
  ZeroAddress: 'Address cannot be zero',
};
