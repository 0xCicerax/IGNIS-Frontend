/** Module */

// ─────────────────────────────────────────────────────────────────────────────
// BLOCKCHAIN TYPES
// ─────────────────────────────────────────────────────────────────────────────

export type Address = `0x${string}`;
export type Hash = `0x${string}`;

// ─────────────────────────────────────────────────────────────────────────────
// TOKEN TYPES
// ─────────────────────────────────────────────────────────────────────────────

export interface Token {
  symbol: string;
  name: string;
  address?: Address;
  decimals: number;
  price: number;
  balance: number;
  icon?: string;
  color?: string;
  isYieldBearing?: boolean;
  isNative?: boolean;
  protocol?: string;
  underlyingToken?: string;
  apy?: number;
}

export interface TokenBalance {
  token: Token;
  balance: string;
  balanceUsd: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// POOL TYPES
// ─────────────────────────────────────────────────────────────────────────────

export type PoolType = 'CLAMM' | 'LBAMM';

export interface Pool {
  id: string;
  token0: Token;
  token1: Token;
  type: PoolType;
  fee: number;
  tvl: number;
  volume24h: number;
  apr: number;
  aprFees?: number;
  aprEmissions?: number;
  aprYield?: number;
  isYieldBearing?: boolean;
  platforms?: string[];
  routesTo?: string;
  feeTier?: string;
}

export interface PoolStats {
  tvl: number;
  volume24h: number;
  volume7d: number;
  fees24h: number;
  apr: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// POSITION TYPES
// ─────────────────────────────────────────────────────────────────────────────

export type PositionStatus = 'active' | 'inactive' | 'closed';

export interface Position {
  id: string;
  pool: Pool;
  token0Amount: number;
  token1Amount: number;
  minPrice: number;
  maxPrice: number;
  status: PositionStatus;
  unclaimedFees: number;
  unclaimedYield?: number;
  createdAt?: Date;
}

export interface PositionSummary {
  totalValue: number;
  totalUnclaimedFees: number;
  totalUnclaimedYield: number;
  positionCount: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// SWAP TYPES
// ─────────────────────────────────────────────────────────────────────────────

export type SwapMode = 'swap' | 'twap' | 'limit';

export interface SwapQuote {
  fromToken: Token;
  toToken: Token;
  fromAmount: string;
  toAmount: string;
  rate: number;
  priceImpact: number;
  route: string[];
  minReceived: string;
  networkFee: string;
  gasEstimate?: bigint;
}

export interface SwapSettings {
  slippage: number;
  deadline: number;
  mevProtection: boolean;
}

export interface TWAPSettings {
  totalTrades: number;
  tradeInterval: number; // minutes
}

export interface LimitSettings {
  limitPrice: string;
  expiry: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// TRANSACTION TYPES
// ─────────────────────────────────────────────────────────────────────────────

export type TxStatus = 'pending' | 'success' | 'failed';
export type TxType = 'swap' | 'approve' | 'addLiquidity' | 'removeLiquidity' | 'stake' | 'unstake' | 'claim';

export interface Transaction {
  id: string;
  hash?: Hash;
  type: TxType;
  status: TxStatus;
  summary: string;
  timestamp: number;
  error?: string;
}

export interface PendingTransactions {
  transactions: Transaction[];
  pendingCount: number;
  addTx: (tx: Omit<Transaction, 'id' | 'timestamp'>) => string;
  updateTx: (id: string, updates: Partial<Transaction>) => void;
  removeTx: (id: string) => void;
  clearAll: () => void;
  clearCompleted: () => void;
  // Aliases for page compatibility
  addTransaction: (tx: Omit<Transaction, 'id' | 'timestamp'>) => string;
  confirmTransaction: (id: string, hash: string) => void;
  failTransaction: (id: string, error: string) => void;
}

// ─────────────────────────────────────────────────────────────────────────────
// STAKING TYPES
// ─────────────────────────────────────────────────────────────────────────────

export interface StakingLock {
  id: string;
  amount: number;
  veAmount: number;
  lockWeeks: number;
  unlockDate: Date | null; // null for perma-lock
  isPermaLock: boolean;
  createdAt: Date;
}

export interface StakingStats {
  totalLocked: number;
  totalVeTokens: number;
  averageLockTime: number;
  lockCount: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// ANALYTICS TYPES
// ─────────────────────────────────────────────────────────────────────────────

export interface ProtocolStats {
  tvl: number;
  volume24h: number;
  volume7d: number;
  fees24h: number;
  uniqueUsers: number;
  totalPools: number;
  totalTransactions: number;
}

export interface ChartDataPoint {
  date: string;
  value: number;
  label?: string;
}

export interface TimeSeriesData {
  data: ChartDataPoint[];
  change24h: number;
  change7d: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// WALLET TYPES
// ─────────────────────────────────────────────────────────────────────────────

export interface WalletState {
  address: Address | null;
  isConnected: boolean;
  isConnecting: boolean;
  chainId: number | null;
}

export interface WalletContextType extends WalletState {
  connect: () => Promise<void>;
  disconnect: () => void;
  switchChain: (chainId: number) => Promise<void>;
}

// ─────────────────────────────────────────────────────────────────────────────
// COMPONENT PROP TYPES
// ─────────────────────────────────────────────────────────────────────────────

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export interface TokenSelectorModalProps extends ModalProps {
  onSelect: (token: Token) => void;
  selectedToken: Token | null;
  otherToken: Token | null;
  favoriteTokens?: string[];
  recentTokens?: string[];
  onToggleFavorite?: (symbol: string) => void;
}

export interface TransactionConfirmModalProps extends ModalProps {
  onConfirm: () => void;
  type: 'swap' | 'twap' | 'limit' | 'addLiquidity' | 'removeLiquidity' | 'stake' | 'claim';
  fromToken?: Token | null;
  toToken?: Token | null;
  fromAmount?: string;
  toAmount?: string;
  rate?: number;
  priceImpact?: number;
  slippage?: number;
  deadline?: number;
  minReceived?: string;
  networkFee?: string;
  route?: string;
  totalTrades?: number;
  tradeInterval?: number;
  limitPrice?: string;
  expiry?: string;
  pool?: Pool;
  lockDuration?: number;
  veAmount?: number;
  isPending?: boolean;
}

export interface SlippageSettingsProps extends ModalProps {
  slippage: number;
  setSlippage: (value: number) => void;
  deadline: number;
  setDeadline: (value: number) => void;
}

export interface AddLiquidityModalProps extends ModalProps {
  pool?: Pool | null;
  isConnected: boolean;
  onConnect: () => void;
}

export interface LockIgnisModalProps extends ModalProps {
  igniBalance?: number;
}

export interface WithdrawModalProps extends ModalProps {
  position?: Position | null;
}

// ─────────────────────────────────────────────────────────────────────────────
// UI COMPONENT TYPES
// ─────────────────────────────────────────────────────────────────────────────

export interface TokenIconProps {
  token: Token | null;
  size?: number;
  showProtocol?: boolean;
}

export interface DualTokenIconProps {
  token0: Token | null;
  token1: Token | null;
  size?: number;
  showProtocol?: boolean;
}

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export interface CardProps {
  children: React.ReactNode;
  variant?: 'default' | 'glass' | 'bordered';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  className?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// UTILITY TYPES
// ─────────────────────────────────────────────────────────────────────────────

export type SortDirection = 'asc' | 'desc';

export interface SortConfig<T> {
  key: keyof T;
  direction: SortDirection;
}

export interface FilterConfig {
  search: string;
  type?: PoolType | 'all';
  showYieldOnly?: boolean;
}

// Re-export everything
export default {
  // This file exports all types via named exports above
};
