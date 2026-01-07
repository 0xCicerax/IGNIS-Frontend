/** Module */

import { Address, getContract, PublicClient, WalletClient } from 'viem';
import { getChainConfig, getContractAddress, ChainContracts } from './addresses';

// Import ABIs from the abis folder
import GatewayRouterV5ABI from '../../abis/GatewayRouterV5.json';
import AureliaSmartQuoterV5ABI from '../../abis/AureliaSmartQuoterV5.json';
import Gateway4626BufferABI from '../../abis/Gateway4626Buffer.json';
import GatewayRegistryABI from '../../abis/GatewayRegistry.json';
import TokenRegistryV2ABI from '../../abis/TokenRegistryV2.json';
import PoolRegistryABI from '../../abis/PoolRegistry.json';
import GatewayKeeperABI from '../../abis/GatewayKeeper.json';
import BufferStakerV2ABI from '../../abis/BufferStakerV2.json';
import AureliaVaultAdapterABI from '../../abis/AureliaVaultAdapter.json';
import CLPoolManagerABI from '../../abis/CLPoolManager.json';
import BinPoolManagerABI from '../../abis/BinPoolManager.json';
import ERC20ABI from '../../abis/ERC20.json';
import ERC4626ABI from '../../abis/ERC4626.json';

// ─────────────────────────────────────────────────────────────────────────────────
// EXPORT ABIs
// ─────────────────────────────────────────────────────────────────────────────────

/**
 * All contract ABIs used by IGNIS
 * 
 * @example
 * ```typescript
 * import { ABIS } from '@/lib/contracts/config';
 * 
 * // Use with viem's readContract
 * const balance = await publicClient.readContract({
 *   address: tokenAddress,
 *   abi: ABIS.ERC20,
 *   functionName: 'balanceOf',
 *   args: [userAddress],
 * });
 * ```
 */
export const ABIS = {
  /**
   * GatewayRouterV5 - Main swap router
   * 
   * Key functions:
   * - executeRoute(encodedRoute, amountIn, minAmountOut, recipient, deadline)
   * - executeRouteUnwrapETH(...) - Same but unwraps WETH to ETH at end
   * - executeMultihop(...) - Execute multi-hop swaps
   */
  GatewayRouterV5: GatewayRouterV5ABI,
  
  /**
   * AureliaSmartQuoterV5 - Quote provider
   * 
   * Key functions:
   * - quote(params) - Get expected output for a swap
   * - quoteExactInput(path, amountIn) - Quote for exact input swaps
   * - quoteExactOutput(path, amountOut) - Quote for exact output swaps
   * - findBestRoute(tokenIn, tokenOut, amountIn) - Find optimal route
   */
  AureliaSmartQuoterV5: AureliaSmartQuoterV5ABI,
  
  /**
   * Gateway4626Buffer - ERC4626 vault token converter
   * 
   * The buffer holds both the vault token and its underlying asset,
   * enabling instant conversions without waiting for vault deposits/withdrawals.
   * This provides ~60% gas savings vs direct vault interactions.
   * 
   * Key functions:
   * - deposit(assets, receiver) - Deposit underlying, receive vault tokens
   * - withdraw(assets, receiver, owner) - Withdraw underlying from vault tokens
   * - convertToShares(assets) - Calculate vault tokens for asset amount
   * - convertToAssets(shares) - Calculate assets for vault token amount
   */
  Gateway4626Buffer: Gateway4626BufferABI,
  
  /**
   * GatewayRegistry - Maps vault tokens to their buffers
   * 
   * Key functions:
   * - getGateway(vaultToken) - Get buffer address for a vault token
   * - isRegistered(vaultToken) - Check if vault has a buffer
   * - getAllGateways() - List all registered buffers
   */
  GatewayRegistry: GatewayRegistryABI,
  
  /**
   * TokenRegistryV2 - Whitelist of supported tokens
   * 
   * Key functions:
   * - isWhitelisted(token) - Check if token is supported
   * - getTokenInfo(token) - Get token metadata
   * - getAllTokens() - List all whitelisted tokens
   */
  TokenRegistryV2: TokenRegistryV2ABI,
  
  /**
   * PoolRegistry - Central pool registry
   * 
   * Key functions:
   * - getPool(token0, token1, fee) - Get pool address
   * - getAllPools() - List all pools
   * - getPoolInfo(poolAddress) - Get pool metadata
   */
  PoolRegistry: PoolRegistryABI,
  
  /**
   * GatewayKeeper - Buffer liquidity manager
   * 
   * Manages liquidity levels in buffers and triggers rebalancing
   * when buffers become imbalanced.
   * 
   * Key functions:
   * - getBufferBalance(buffer) - Get current buffer state
   * - rebalance(buffer) - Trigger manual rebalance
   * - setTargetRatio(buffer, ratio) - Set target asset/share ratio
   */
  GatewayKeeper: GatewayKeeperABI,
  
  /**
   * BufferStakerV2 - IGNIS staking contract
   * 
   * Stake IGNIS to earn protocol revenue share.
   * Implements vote-escrowed mechanics (veIGNIS).
   * 
   * Key functions:
   * - stake(amount, lockWeeks) - Stake IGNIS for veIGNIS
   * - stakePermanent(amount) - Permanent lock for max boost
   * - withdraw(lockId) - Withdraw expired lock
   * - claimRewards() - Claim accumulated rewards
   * - getVotingPower(account) - Get current veIGNIS balance
   */
  BufferStakerV2: BufferStakerV2ABI,
  
  /**
   * AureliaVaultAdapter - Vault compatibility layer
   * 
   * Adapts non-standard vaults to ERC4626 interface.
   * 
   * Key functions:
   * - getUnderlyingToken(vault) - Get vault's underlying asset
   * - getSharePrice(vault) - Get current share price
   */
  AureliaVaultAdapter: AureliaVaultAdapterABI,
  
  /**
   * CLPoolManager - Concentrated Liquidity pools
   * 
   * Uniswap V3 style pools with custom tick ranges.
   * 
   * Key functions:
   * - mint(params) - Add liquidity to a range
   * - burn(params) - Remove liquidity from a range
   * - swap(params) - Execute a swap
   * - collect(params) - Collect earned fees
   */
  CLPoolManager: CLPoolManagerABI,
  
  /**
   * BinPoolManager - Liquidity Book pools
   * 
   * Trader Joe style discrete bin liquidity.
   * 
   * Key functions:
   * - addLiquidity(params) - Add liquidity to bins
   * - removeLiquidity(params) - Remove liquidity from bins
   * - swap(params) - Execute a swap
   * - getPriceFromBin(binId) - Get price for a bin
   */
  BinPoolManager: BinPoolManagerABI,
  
  /**
   * Standard ERC20 interface
   * 
   * Key functions:
   * - balanceOf(account) - Get token balance
   * - allowance(owner, spender) - Get approval amount
   * - approve(spender, amount) - Approve token spending
   * - transfer(to, amount) - Transfer tokens
   */
  ERC20: ERC20ABI,
  
  /**
   * ERC4626 Tokenized Vault Standard
   * 
   * Key functions:
   * - deposit(assets, receiver) - Deposit and mint shares
   * - withdraw(assets, receiver, owner) - Burn shares and withdraw
   * - redeem(shares, receiver, owner) - Redeem shares for assets
   * - convertToShares(assets) - Preview deposit
   * - convertToAssets(shares) - Preview withdrawal
   * - totalAssets() - Total underlying held by vault
   */
  ERC4626: ERC4626ABI,
} as const;

// ─────────────────────────────────────────────────────────────────────────────────
// CONTRACT ABI MAPPING
// ─────────────────────────────────────────────────────────────────────────────────

/**
 * Internal mapping of contract names to their ABIs.
 * Used by getReadContract and getWriteContract.
 */
const CONTRACT_ABIS: Partial<Record<keyof ChainContracts, readonly unknown[]>> = {
  gatewayRouter: GatewayRouterV5ABI as readonly unknown[],
  smartQuoter: AureliaSmartQuoterV5ABI as readonly unknown[],
  gateway4626Buffer: Gateway4626BufferABI as readonly unknown[],
  gatewayRegistry: GatewayRegistryABI as readonly unknown[],
  tokenRegistry: TokenRegistryV2ABI as readonly unknown[],
  poolRegistry: PoolRegistryABI as readonly unknown[],
  gatewayKeeper: GatewayKeeperABI as readonly unknown[],
  bufferStaker: BufferStakerV2ABI as readonly unknown[],
  vaultAdapter: AureliaVaultAdapterABI as readonly unknown[],
  clPoolManager: CLPoolManagerABI as readonly unknown[],
  binPoolManager: BinPoolManagerABI as readonly unknown[],
};

// ─────────────────────────────────────────────────────────────────────────────────
// CONTRACT INSTANCE FACTORY
// ─────────────────────────────────────────────────────────────────────────────────

/**
 * Get a read-only contract instance for querying data.
 * 
 * Use this for:
 * - Getting quotes
 * - Checking balances
 * - Reading pool state
 * - Any operation that doesn't modify blockchain state
 * 
 * @param chainId - The chain ID (e.g., 8453 for Base)
 * @param contractName - Name of the contract from ChainContracts
 * @param publicClient - Viem public client instance
 * @returns Contract instance with read methods
 * 
 * @example
 * ```typescript
 * const quoter = getReadContract(8453, 'smartQuoter', publicClient);
 * 
 * const quote = await quoter.read.quoteExactInput([
 *   encodedPath,
 *   amountIn
 * ]);
 * ```
 * 
 * @throws Error if contract is not configured for the chain
 * @throws Error if ABI is not found
 */
export function getReadContract<T extends keyof ChainContracts>(
  chainId: number,
  contractName: T,
  publicClient: PublicClient
) {
  const address = getContractAddress(chainId, contractName);
  const abi = CONTRACT_ABIS[contractName];
  
  if (!abi) {
    throw new Error(`No ABI found for contract: ${contractName}`);
  }

  return getContract({
    address,
    abi,
    client: publicClient,
  });
}

/**
 * Get a write-enabled contract instance for sending transactions.
 * 
 * Use this for:
 * - Executing swaps
 * - Adding/removing liquidity
 * - Staking tokens
 * - Any operation that modifies blockchain state
 * 
 * @param chainId - The chain ID
 * @param contractName - Name of the contract from ChainContracts
 * @param walletClient - Viem wallet client instance (connected wallet)
 * @returns Contract instance with write methods
 * 
 * @example
 * ```typescript
 * const router = getWriteContract(8453, 'gatewayRouter', walletClient);
 * 
 * const hash = await router.write.executeRoute([
 *   encodedRoute,
 *   amountIn,
 *   minAmountOut,
 *   recipient,
 *   deadline
 * ]);
 * ```
 * 
 * @throws Error if contract is not configured for the chain
 * @throws Error if ABI is not found
 */
export function getWriteContract<T extends keyof ChainContracts>(
  chainId: number,
  contractName: T,
  walletClient: WalletClient
) {
  const address = getContractAddress(chainId, contractName);
  const abi = CONTRACT_ABIS[contractName];
  
  if (!abi) {
    throw new Error(`No ABI found for contract: ${contractName}`);
  }

  return getContract({
    address,
    abi,
    client: walletClient,
  });
}

/**
 * Get an ERC20 token contract instance.
 * 
 * Use this for:
 * - Checking token balances
 * - Approving token spending
 * - Checking allowances
 * 
 * @param tokenAddress - The token contract address
 * @param publicClient - Viem public client instance
 * @returns ERC20 contract instance
 * 
 * @example
 * ```typescript
 * const usdc = getERC20Contract(USDC_ADDRESS, publicClient);
 * 
 * const balance = await usdc.read.balanceOf([userAddress]);
 * const allowance = await usdc.read.allowance([userAddress, spenderAddress]);
 * ```
 */
export function getERC20Contract(
  tokenAddress: Address,
  publicClient: PublicClient
) {
  return getContract({
    address: tokenAddress,
    abi: ERC20ABI as readonly unknown[],
    client: publicClient,
  });
}

/**
 * Get an ERC4626 vault contract instance.
 * 
 * ERC4626 is the tokenized vault standard. Use this for:
 * - Checking vault share balances
 * - Converting between shares and assets
 * - Direct vault deposits/withdrawals (when not using buffer)
 * 
 * @param vaultAddress - The vault contract address
 * @param publicClient - Viem public client instance
 * @returns ERC4626 contract instance
 * 
 * @example
 * ```typescript
 * const vault = getERC4626Contract(AAVE_USDC_VAULT, publicClient);
 * 
 * // Get underlying asset amount for shares
 * const assets = await vault.read.convertToAssets([shareAmount]);
 * 
 * // Get shares for underlying asset amount
 * const shares = await vault.read.convertToShares([assetAmount]);
 * 
 * // Get total underlying held by vault
 * const totalAssets = await vault.read.totalAssets();
 * ```
 */
export function getERC4626Contract(
  vaultAddress: Address,
  publicClient: PublicClient
) {
  return getContract({
    address: vaultAddress,
    abi: ERC4626ABI as readonly unknown[],
    client: publicClient,
  });
}

// ─────────────────────────────────────────────────────────────────────────────────
// COMMON CONTRACT ADDRESSES
// ─────────────────────────────────────────────────────────────────────────────────

/**
 * Native token wrapper addresses by chain.
 * 
 * These are the canonical WETH/WBNB addresses for wrapping/unwrapping
 * native tokens. Used for ETH -> token and token -> ETH swaps.
 */
export const NATIVE_TOKEN_WRAPPER: Record<number, Address> = {
  8453: '0x4200000000000000000000000000000000000006', // Base WETH
  84532: '0x4200000000000000000000000000000000000006', // Base Sepolia WETH
  56: '0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c', // BSC WBNB
  97: '0xae13d989daC2f0dEbFf460aC112a837C89BAa7cd', // BSC Testnet WBNB
};

/**
 * Zero address constant.
 * Used for native token representation in some contexts.
 */
export const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000' as Address;

/**
 * Maximum uint256 value.
 * Used for infinite approvals (use with caution).
 * 
 * @example
 * ```typescript
 * // Infinite approval (common but has security implications)
 * await token.write.approve([spender, MAX_UINT256]);
 * 
 * // Consider exact approvals for better security
 * await token.write.approve([spender, exactAmount]);
 * ```
 */
export const MAX_UINT256 = BigInt('0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff');

// ─────────────────────────────────────────────────────────────────────────────────
// SWAP ACTION TYPES
// ─────────────────────────────────────────────────────────────────────────────────

/**
 * Swap through a Concentrated Liquidity (Uniswap V3 style) pool.
 * 
 * CL pools have custom price ranges where liquidity is concentrated.
 * Most efficient for stable pairs and pairs with predictable price ranges.
 */
export const ACTION_SWAP_CL = 0;

/**
 * Swap through a Bin (Liquidity Book) pool.
 * 
 * Bin pools have discrete price bins with uniform liquidity.
 * Better for volatile pairs and provides more flexibility for LPs.
 */
export const ACTION_SWAP_BIN = 1;

/**
 * Wrap native token (ETH/BNB) to wrapped version (WETH/WBNB).
 * Used at the start of a route when swapping from native token.
 */
export const ACTION_WRAP = 2;

/**
 * Unwrap wrapped token back to native.
 * Used at the end of a route when user wants to receive native token.
 */
export const ACTION_UNWRAP = 3;

// ─────────────────────────────────────────────────────────────────────────────────
// FEE TIERS
// ─────────────────────────────────────────────────────────────────────────────────

/**
 * Standard fee tiers in hundredths of a basis point.
 * 
 * Fee selection guide:
 * - LOWEST (0.01%): Stablecoin pairs (USDC/USDT)
 * - LOW (0.05%): Correlated pairs (ETH/stETH)
 * - MEDIUM (0.30%): Most pairs (ETH/USDC)
 * - HIGH (1.00%): Exotic/volatile pairs
 * 
 * @example
 * ```typescript
 * // Check if pool has low fee tier
 * if (pool.fee === FEE_TIERS.LOW) {
 *   // Likely a stablecoin or correlated pair
 * }
 * ```
 */
export const FEE_TIERS = {
  /** 0.01% - For stablecoins and highly correlated pairs */
  LOWEST: 100,
  /** 0.05% - For correlated pairs like ETH/stETH */
  LOW: 500,
  /** 0.30% - Standard fee for most pairs */
  MEDIUM: 3000,
  /** 1.00% - For exotic/volatile pairs */
  HIGH: 10000,
} as const;

// ─────────────────────────────────────────────────────────────────────────────────
// TICK SPACINGS (Concentrated Liquidity)
// ─────────────────────────────────────────────────────────────────────────────────

/**
 * Tick spacings for CL pools by fee tier.
 * 
 * Tick spacing determines the granularity of price ranges:
 * - Lower spacing = more precise ranges, but higher gas for crossing
 * - Higher spacing = coarser ranges, but lower gas costs
 * 
 * The tick spacing is chosen to balance:
 * 1. Capital efficiency (lower = better)
 * 2. Gas costs (higher = better)
 * 
 * @example
 * ```typescript
 * // Get tick spacing for a 0.3% fee pool
 * const spacing = TICK_SPACINGS[3000]; // 60
 * 
 * // Ensure tick is aligned to spacing
 * const alignedTick = Math.floor(tick / spacing) * spacing;
 * ```
 */
export const TICK_SPACINGS: Record<number, number> = {
  100: 1,     // 0.01% fee -> tick spacing 1 (finest granularity)
  500: 10,    // 0.05% fee -> tick spacing 10
  3000: 60,   // 0.30% fee -> tick spacing 60
  10000: 200, // 1.00% fee -> tick spacing 200 (coarsest)
};

// ─────────────────────────────────────────────────────────────────────────────────
// BIN STEPS (Liquidity Book Pools)
// ─────────────────────────────────────────────────────────────────────────────────

/**
 * Bin steps for Liquidity Book pools.
 * 
 * Bin step determines the price increment between adjacent bins:
 * - Tighter bins = more capital efficient, but more bins needed
 * - Wider bins = less efficient, but simpler management
 * 
 * @example
 * ```typescript
 * // For a volatile pair, use wider bins
 * const binStep = BIN_STEPS.VOLATILE; // 1% per bin
 * 
 * // For stablecoins, use tight bins
 * const binStep = BIN_STEPS.TIGHT; // 0.01% per bin
 * ```
 */
export const BIN_STEPS = {
  /** 0.01% per bin - For stablecoins */
  TIGHT: 1,
  /** 0.10% per bin - Standard */
  NORMAL: 10,
  /** 0.25% per bin - For moderately volatile pairs */
  WIDE: 25,
  /** 1.00% per bin - For highly volatile pairs */
  VOLATILE: 100,
} as const;

// ─────────────────────────────────────────────────────────────────────────────────
// DEFAULT TRANSACTION PARAMETERS
// ─────────────────────────────────────────────────────────────────────────────────

/**
 * Default slippage tolerance in basis points.
 * 
 * 50 bps = 0.5% slippage tolerance
 * 
 * This means if you expect 1000 USDC out, you'll accept minimum 995 USDC.
 * Users can customize this in settings for:
 * - Lower slippage: May cause more failed transactions
 * - Higher slippage: May receive worse prices
 */
export const DEFAULT_SLIPPAGE_BPS = 50; // 0.5%

/**
 * Default transaction deadline in seconds from now.
 * 
 * 1200 seconds = 20 minutes
 * 
 * If the transaction isn't mined within this time, it will revert.
 * This protects against:
 * - Stale prices during network congestion
 * - MEV attacks that delay your transaction
 */
export const DEFAULT_DEADLINE_SECONDS = 1200; // 20 minutes
