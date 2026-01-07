
import { useState, useEffect, useCallback, useMemo } from 'react';
import { query, isSubgraphConfigured } from '../../lib/graphql/client';
import { logger } from '../../utils/logger';
import { TOKENS_QUERY, TOKEN_QUERY, VAULT_TOKENS_QUERY } from '../../lib/graphql/queries';
import { Token, TokensResponse, TokenResponse } from '../../lib/graphql/types';

// ─────────────────────────────────────────────────────────────────────────────────
// MOCK DATA
// ─────────────────────────────────────────────────────────────────────────────────

const MOCK_TOKENS: Token[] = [
  {
    id: '0x4200000000000000000000000000000000000006',
    symbol: 'WETH',
    name: 'Wrapped Ether',
    decimals: 18,
    allowed: true,
    isVaultToken: false,
    underlyingToken: null,
    totalVolume: '50000',
    totalVolumeUSD: '125000000',
    swapCount: '25000',
  },
  {
    id: '0x833589fcd6edb6e08f4c7c32d4f71b54bda02913',
    symbol: 'USDC',
    name: 'USD Coin',
    decimals: 6,
    allowed: true,
    isVaultToken: false,
    underlyingToken: null,
    totalVolume: '100000000',
    totalVolumeUSD: '100000000',
    swapCount: '30000',
  },
  {
    id: '0x0000000000000000000000000000000000000001',
    symbol: 'aurUSDC',
    name: 'Aurelia USDC Vault',
    decimals: 6,
    allowed: true,
    isVaultToken: true,
    underlyingToken: {
      id: '0x833589fcd6edb6e08f4c7c32d4f71b54bda02913',
      symbol: 'USDC',
      name: 'USD Coin',
      decimals: 6,
      allowed: true,
      isVaultToken: false,
      underlyingToken: null,
      totalVolume: '0',
      totalVolumeUSD: '0',
      swapCount: '0',
    },
    totalVolume: '50000000',
    totalVolumeUSD: '50000000',
    swapCount: '10000',
  },
  {
    id: '0x0000000000000000000000000000000000000002',
    symbol: 'aurWETH',
    name: 'Aurelia WETH Vault',
    decimals: 18,
    allowed: true,
    isVaultToken: true,
    underlyingToken: {
      id: '0x4200000000000000000000000000000000000006',
      symbol: 'WETH',
      name: 'Wrapped Ether',
      decimals: 18,
      allowed: true,
      isVaultToken: false,
      underlyingToken: null,
      totalVolume: '0',
      totalVolumeUSD: '0',
      swapCount: '0',
    },
    totalVolume: '20000',
    totalVolumeUSD: '50000000',
    swapCount: '8000',
  },
];

// ─────────────────────────────────────────────────────────────────────────────────
// HOOK: useTokens
// ─────────────────────────────────────────────────────────────────────────────────

interface UseTokensOptions {
  chainId: number;
  first?: number;
  skip?: number;
  orderBy?: string;
  orderDirection?: 'asc' | 'desc';
}

interface UseTokensResult {
  data: Token[];
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

export function useTokens(options: UseTokensOptions): UseTokensResult {
  const { 
    chainId, 
    first = 100, 
    skip = 0, 
    orderBy = 'totalVolumeUSD',
    orderDirection = 'desc' 
  } = options;
  
  const [data, setData] = useState<Token[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = useCallback(async () => {
    if (!isSubgraphConfigured(chainId)) {
      setData(MOCK_TOKENS);
      setIsLoading(false);
      return;
    }

    try {
      const response = await query<TokensResponse>(
        TOKENS_QUERY,
        { first, skip, orderBy, orderDirection },
        { chainId }
      );
      setData(response.tokens);
      setError(null);
    } catch (err: unknown) {
      logger.error('useTokens failed', err);
      setError(err instanceof Error ? err : new Error('Failed to fetch tokens'));
      setData(MOCK_TOKENS);
    } finally {
      setIsLoading(false);
    }
  }, [chainId, first, skip, orderBy, orderDirection]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, isLoading, error, refetch: fetchData };
}

// ─────────────────────────────────────────────────────────────────────────────────
// HOOK: useToken
// ─────────────────────────────────────────────────────────────────────────────────

interface UseTokenOptions {
  chainId: number;
  address: string | null;
}

interface UseTokenResult {
  data: Token | null;
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

export function useToken(options: UseTokenOptions): UseTokenResult {
  const { chainId, address } = options;
  
  const [data, setData] = useState<Token | null>(null);
  const [isLoading, setIsLoading] = useState(!!address);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = useCallback(async () => {
    if (!address) {
      setData(null);
      setIsLoading(false);
      return;
    }

    if (!isSubgraphConfigured(chainId)) {
      const token = MOCK_TOKENS.find(t => t.id.toLowerCase() === address.toLowerCase());
      setData(token || null);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const response = await query<TokenResponse>(
        TOKEN_QUERY,
        { id: address.toLowerCase() },
        { chainId }
      );
      setData(response.token);
      setError(null);
    } catch (err: unknown) {
      logger.error('useToken failed', err);
      setError(err instanceof Error ? err : new Error('Failed to fetch token'));
    } finally {
      setIsLoading(false);
    }
  }, [chainId, address]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, isLoading, error, refetch: fetchData };
}

// ─────────────────────────────────────────────────────────────────────────────────
// HOOK: useVaultTokens
// ─────────────────────────────────────────────────────────────────────────────────

interface UseVaultTokensOptions {
  chainId: number;
}

export function useVaultTokens(options: UseVaultTokensOptions): UseTokensResult {
  const { chainId } = options;
  
  const [data, setData] = useState<Token[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = useCallback(async () => {
    if (!isSubgraphConfigured(chainId)) {
      const vaultTokens = MOCK_TOKENS.filter(t => t.isVaultToken);
      setData(vaultTokens);
      setIsLoading(false);
      return;
    }

    try {
      const response = await query<TokensResponse>(
        VAULT_TOKENS_QUERY,
        {},
        { chainId }
      );
      setData(response.tokens);
      setError(null);
    } catch (err: unknown) {
      logger.error('useVaultTokens failed', err);
      setError(err instanceof Error ? err : new Error('Failed to fetch vault tokens'));
    } finally {
      setIsLoading(false);
    }
  }, [chainId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, isLoading, error, refetch: fetchData };
}

// ─────────────────────────────────────────────────────────────────────────────────
// TOKEN SEARCH / FILTER HELPERS
// ─────────────────────────────────────────────────────────────────────────────────

/**
 * Filter tokens by search query
 */
export function filterTokens(tokens: Token[], searchQuery: string): Token[] {
  if (!searchQuery.trim()) return tokens;
  
  const query = searchQuery.toLowerCase().trim();
  
  return tokens.filter(token => 
    token.symbol.toLowerCase().includes(query) ||
    token.name.toLowerCase().includes(query) ||
    token.id.toLowerCase() === query
  );
}

/**
 * Separate tokens into vault tokens and regular tokens
 */
export function categorizeTokens(tokens: Token[]): {
  regularTokens: Token[];
  vaultTokens: Token[];
} {
  const regularTokens: Token[] = [];
  const vaultTokens: Token[] = [];
  
  for (const token of tokens) {
    if (token.isVaultToken) {
      vaultTokens.push(token);
    } else {
      regularTokens.push(token);
    }
  }
  
  return { regularTokens, vaultTokens };
}

/**
 * Get underlying token for a vault token
 */
export function getUnderlyingToken(token: Token): Token | null {
  if (!token.isVaultToken) return null;
  return token.underlyingToken;
}

/**
 * Find vault tokens for an underlying token
 */
export function findVaultTokensFor(tokens: Token[], underlyingAddress: string): Token[] {
  return tokens.filter(
    t => t.isVaultToken && 
    t.underlyingToken?.id.toLowerCase() === underlyingAddress.toLowerCase()
  );
}
