import { logger } from '../../utils/logger';
import { withRetry, retryPatterns, createRateLimiter, rateLimitPatterns } from '../../utils/retry';

// ─────────────────────────────────────────────────────────────────────────────────
// SUBGRAPH ENDPOINTS - UPDATE THESE AFTER DEPLOYMENT
// ─────────────────────────────────────────────────────────────────────────────────

export const SUBGRAPH_URLS = {
  // Base Mainnet
  8453: 'https://api.studio.thegraph.com/query/YOUR_ID/ignis-base/version/latest',
  
  // Base Sepolia (Testnet)
  84532: 'https://api.studio.thegraph.com/query/YOUR_ID/ignis-base-sepolia/version/latest',
  
  // BSC Mainnet
  56: 'https://api.studio.thegraph.com/query/YOUR_ID/ignis-bsc/version/latest',
  
  // BSC Testnet
  97: 'https://api.studio.thegraph.com/query/YOUR_ID/ignis-bsc-testnet/version/latest',
} as const;

// Default chain for development
export const DEFAULT_CHAIN_ID = 84532; // Base Sepolia

// Rate limiter for subgraph queries
const subgraphRateLimiter = createRateLimiter('subgraph', rateLimitPatterns.subgraph);

// ─────────────────────────────────────────────────────────────────────────────────
// GRAPHQL CLIENT
// ─────────────────────────────────────────────────────────────────────────────────

export interface GraphQLResponse<T> {
  data?: T;
  errors?: Array<{ message: string }>;
}

export interface QueryOptions {
  chainId?: number;
  signal?: AbortSignal;
  /** Skip retry logic (default: false) */
  noRetry?: boolean;
}

/**
 * Execute a GraphQL query against the subgraph with retry and rate limiting
 */
export async function query<T>(
  queryString: string,
  variables: Record<string, unknown> = {},
  options: QueryOptions = {}
): Promise<T> {
  const chainId = options.chainId ?? DEFAULT_CHAIN_ID;
  const url = SUBGRAPH_URLS[chainId as keyof typeof SUBGRAPH_URLS];
  
  if (!url || url.includes('YOUR_ID')) {
    logger.warn('Subgraph not configured, using mock data', { chainId });
    throw new Error(`Subgraph not configured for chain ${chainId}`);
  }

  const fetchQuery = async (): Promise<T> => {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: queryString,
        variables,
      }),
      signal: options.signal,
    });

    if (!response.ok) {
      throw new Error(`Subgraph request failed: ${response.status} ${response.statusText}`);
    }

    const result: GraphQLResponse<T> = await response.json();

    if (result.errors && result.errors.length > 0) {
      throw new Error(`Subgraph query error: ${result.errors[0].message}`);
    }

    if (!result.data) {
      throw new Error('Subgraph returned no data');
    }

    return result.data;
  };

  // Apply rate limiting
  const rateLimitedFetch = () => subgraphRateLimiter(fetchQuery);

  // Apply retry logic unless disabled
  if (options.noRetry) {
    return rateLimitedFetch();
  }

  return withRetry(rateLimitedFetch, {
    ...retryPatterns.subgraph,
    signal: options.signal,
    onRetry: (attempt, error, nextDelay) => {
      logger.warn(`Subgraph query retry ${attempt}`, {
        error: error instanceof Error ? error.message : String(error),
        nextDelayMs: nextDelay,
        chainId,
      });
    },
  });
}

/**
 * Check if subgraph is configured for a chain
 */
export function isSubgraphConfigured(chainId: number): boolean {
  const url = SUBGRAPH_URLS[chainId as keyof typeof SUBGRAPH_URLS];
  return !!url && !url.includes('YOUR_ID');
}

/**
 * Get subgraph URL for a chain
 */
export function getSubgraphUrl(chainId: number): string | null {
  const url = SUBGRAPH_URLS[chainId as keyof typeof SUBGRAPH_URLS];
  if (!url || url.includes('YOUR_ID')) return null;
  return url;
}
