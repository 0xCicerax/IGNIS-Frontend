/** GraphQL types */
// ─────────────────────────────────────────────────────────────────────────────────
// SCALAR TYPES
// ─────────────────────────────────────────────────────────────────────────────────

export type BigInt = string;
export type BigDecimal = string;
export type Bytes = string;
export type ID = string;

// ─────────────────────────────────────────────────────────────────────────────────
// PROTOCOL
// ─────────────────────────────────────────────────────────────────────────────────

export interface Protocol {
  id: ID;
  totalVolumeUSD: BigDecimal;
  totalSwaps: BigInt;
  totalWraps: BigInt;
  totalUnwraps: BigInt;
  totalUsers: BigInt;
  totalVaults: BigInt;
  totalGasSaved: BigInt;
  totalStaked: BigInt;
  totalRewardsDistributed: BigInt;
  createdAt: BigInt;
  updatedAt: BigInt;
}

// ─────────────────────────────────────────────────────────────────────────────────
// TOKEN
// ─────────────────────────────────────────────────────────────────────────────────

export interface Token {
  id: ID;
  symbol: string;
  name: string;
  decimals: number;
  allowed: boolean;
  isVaultToken: boolean;
  underlyingToken: Token | null;
  totalVolume: BigDecimal;
  totalVolumeUSD: BigDecimal;
  swapCount: BigInt;
}

// ─────────────────────────────────────────────────────────────────────────────────
// VAULT
// ─────────────────────────────────────────────────────────────────────────────────

export interface Vault {
  id: ID;
  vaultToken: Token;
  underlying: Token;
  name: string;
  symbol: string;
  decimals: number;
  enabled: boolean;
  isPrimary: boolean;
  gateway: Bytes | null;
  maxWrapPerTx: BigInt;
  maxUnwrapPerTx: BigInt;
  totalAssetsDeposited: BigDecimal;
  totalSharesMinted: BigDecimal;
  totalAssetsWithdrawn: BigDecimal;
  totalSharesBurned: BigDecimal;
  exchangeRate: BigDecimal;
  bufferState: BufferState | null;
  disabledAt: BigInt;
  createdAt: BigInt;
  updatedAt: BigInt;
}

// ─────────────────────────────────────────────────────────────────────────────────
// BUFFER STATE
// ─────────────────────────────────────────────────────────────────────────────────

export interface BufferState {
  id: ID;
  vault: Vault;
  underlyingBalance: BigInt;
  sharesBalance: BigInt;
  targetUnderlying: BigInt;
  targetShares: BigInt;
  totalWraps: BigInt;
  totalUnwraps: BigInt;
  bufferHitRate: BigDecimal;
  missRate: BigDecimal;
  gasSaved: BigInt;
  lastRebalance: BigInt;
  updatedAt: BigInt;
}

// ─────────────────────────────────────────────────────────────────────────────────
// CL POOL (Concentrated Liquidity)
// ─────────────────────────────────────────────────────────────────────────────────

export interface CLPool {
  id: ID;
  token0: Token;
  token1: Token;
  fee: number;
  tickSpacing: number;
  hooks: Bytes;
  sqrtPriceX96: BigInt;
  tick: number;
  liquidity: BigInt;
  isRegistered: boolean;
  registeredAt: BigInt | null;
  lastRegistryUpdate: BigInt | null;
  createdAtBlock: BigInt;
  createdAt: BigInt;
}

// ─────────────────────────────────────────────────────────────────────────────────
// BIN POOL (Liquidity Book)
// ─────────────────────────────────────────────────────────────────────────────────

export interface BinPool {
  id: ID;
  token0: Token;
  token1: Token;
  binStep: number;
  hooks: Bytes;
  activeId: number;
  reserveX: BigInt;
  reserveY: BigInt;
  isRegistered: boolean;
  registeredAt: BigInt | null;
  lastRegistryUpdate: BigInt | null;
  createdAtBlock: BigInt;
  createdAt: BigInt;
}

// Unified pool type for frontend
export interface Pool {
  id: ID;
  type: 'CL' | 'BIN';
  token0: Token;
  token1: Token;
  fee: number; // fee for CL, binStep for BIN
  liquidity: BigInt; // liquidity for CL, reserveX for BIN
  isRegistered: boolean;
  createdAt: BigInt;
  // CL specific
  tickSpacing?: number;
  sqrtPriceX96?: BigInt;
  tick?: number;
  // BIN specific
  binStep?: number;
  activeId?: number;
  reserveX?: BigInt;
  reserveY?: BigInt;
}

// ─────────────────────────────────────────────────────────────────────────────────
// POOL REGISTRY STATS
// ─────────────────────────────────────────────────────────────────────────────────

export interface PoolRegistryStats {
  id: ID;
  totalCLPoolsRegistered: BigInt;
  totalBinPoolsRegistered: BigInt;
  lastSyncAt: BigInt;
}

// ─────────────────────────────────────────────────────────────────────────────────
// SWAP
// ─────────────────────────────────────────────────────────────────────────────────

export interface Swap {
  id: ID;
  txHash: Bytes;
  timestamp: BigInt;
  sender: Bytes;
  recipient: Bytes;
  tokenIn: Token;
  tokenOut: Token;
  amountIn: BigDecimal;
  amountOut: BigDecimal;
  amountUSD: BigDecimal;
  priceImpact: BigDecimal;
  route: string;
  gasUsed: BigInt;
  gasSaved: BigInt;
  usedBuffer: boolean;
}

// ─────────────────────────────────────────────────────────────────────────────────
// USER
// ─────────────────────────────────────────────────────────────────────────────────

export interface User {
  id: ID;
  totalSwaps: BigInt;
  totalVolumeUSD: BigDecimal;
  totalGasSaved: BigInt;
  firstInteraction: BigInt;
  lastInteraction: BigInt;
}

// ─────────────────────────────────────────────────────────────────────────────────
// STAKING
// ─────────────────────────────────────────────────────────────────────────────────

export interface StakingPool {
  id: ID;
  underlying: Token;
  rewardToken: Token;
  totalStaked: BigInt;
  rewardRate: BigInt;
  totalRewardsDistributed: BigInt;
  stakerCount: BigInt;
  createdAt: BigInt;
  updatedAt: BigInt;
}

export interface StakerPosition {
  id: ID;
  user: User;
  underlying: Token;
  stakingPool: StakingPool;
  depositedAmount: BigInt;
  pendingRewards: BigInt;
  totalClaimed: BigInt;
  lastUpdate: BigInt;
}

// ─────────────────────────────────────────────────────────────────────────────────
// WRAP/UNWRAP EVENTS
// ─────────────────────────────────────────────────────────────────────────────────

export interface WrapEvent {
  id: ID;
  txHash: Bytes;
  timestamp: BigInt;
  user: User;
  vault: Vault;
  underlyingAmount: BigInt;
  sharesReceived: BigInt;
  usedBuffer: boolean;
  gasSaved: BigInt;
}

export interface UnwrapEvent {
  id: ID;
  txHash: Bytes;
  timestamp: BigInt;
  user: User;
  vault: Vault;
  sharesBurned: BigInt;
  underlyingReceived: BigInt;
  usedBuffer: boolean;
  gasSaved: BigInt;
}

// ─────────────────────────────────────────────────────────────────────────────────
// AGGREGATOR SWAP
// ─────────────────────────────────────────────────────────────────────────────────

export interface AggregatorSwap {
  id: ID;
  txHash: Bytes;
  timestamp: BigInt;
  sender: Bytes;
  recipient: Bytes;
  tokenIn: Token;
  tokenOut: Token;
  amountIn: BigDecimal;
  amountOut: BigDecimal;
  aggregatorSource: string | null;
}

// ─────────────────────────────────────────────────────────────────────────────────
// GATEWAY POLICY
// ─────────────────────────────────────────────────────────────────────────────────

export interface GatewayPolicy {
  id: ID;
  gateway: Bytes;
  maxWrapPerTx: BigInt;
  maxUnwrapPerTx: BigInt;
  updatedAt: BigInt;
}

// ─────────────────────────────────────────────────────────────────────────────────
// TIME SERIES DATA
// ─────────────────────────────────────────────────────────────────────────────────

export interface ProtocolDayData {
  id: ID;
  date: number;
  volumeUSD: BigDecimal;
  tvlUSD: BigDecimal;
  feesUSD: BigDecimal;
  txCount: BigInt;
  uniqueUsers: BigInt;
}

export interface VaultDayData {
  id: ID;
  date: number;
  vault: Vault;
  totalAssets: BigDecimal;
  totalShares: BigDecimal;
  exchangeRate: BigDecimal;
  depositsUSD: BigDecimal;
  withdrawalsUSD: BigDecimal;
}

// ─────────────────────────────────────────────────────────────────────────────────
// QUERY RESPONSE TYPES
// ─────────────────────────────────────────────────────────────────────────────────

export interface ProtocolStatsResponse {
  protocol: Protocol | null;
}

export interface TokensResponse {
  tokens: Token[];
}

export interface TokenResponse {
  token: Token | null;
}

export interface VaultsResponse {
  vaults: Vault[];
}

export interface VaultResponse {
  vault: Vault | null;
}

export interface BufferStatesResponse {
  bufferStates: BufferState[];
}

export interface CLPoolsResponse {
  clpools: CLPool[];
}

export interface BinPoolsResponse {
  binPools: BinPool[];
}

export interface AllPoolsResponse {
  clpools: CLPool[];
  binPools: BinPool[];
}

export interface PoolRegistryStatsResponse {
  poolRegistryStats: PoolRegistryStats | null;
}

export interface SwapsResponse {
  swaps: Swap[];
}

export interface UserResponse {
  user: User | null;
}

export interface UserStatsResponse {
  user: User | null;
  stakerPositions: StakerPosition[];
}

export interface StakingPoolsResponse {
  stakingPools: StakingPool[];
}

export interface StakerPositionsResponse {
  stakerPositions: StakerPosition[];
}

export interface WrapEventsResponse {
  wrapEvents: WrapEvent[];
}

export interface UnwrapEventsResponse {
  unwrapEvents: UnwrapEvent[];
}

export interface AggregatorSwapsResponse {
  aggregatorSwaps: AggregatorSwap[];
}

export interface GatewayPoliciesResponse {
  gatewayPolicies: GatewayPolicy[];
}

export interface ProtocolDayDataResponse {
  protocolDayDatas: ProtocolDayData[];
}

export interface VaultDayDataResponse {
  vaultDayDatas: VaultDayData[];
}
