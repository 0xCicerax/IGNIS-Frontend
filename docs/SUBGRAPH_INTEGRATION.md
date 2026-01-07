# IGNIS DEX — Subgraph Integration Guide

> **Purpose:** Connect the frontend to real on-chain data via The Graph  
> **Current State:** All hooks fall back to mock data  
> **Target State:** Live data from deployed subgraph

---

## Table of Contents

1. [Overview](#overview)
2. [Subgraph Deployment](#subgraph-deployment)
3. [Frontend Configuration](#frontend-configuration)
4. [Hook-by-Hook Integration](#hook-by-hook-integration)
5. [Testing & Validation](#testing--validation)
6. [Troubleshooting](#troubleshooting)

---

## Overview

### Current Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Frontend                              │
├─────────────────────────────────────────────────────────────┤
│  Hooks (usePool, useTokens, etc.)                           │
│       │                                                      │
│       ▼                                                      │
│  isSubgraphConfigured(chainId)?                             │
│       │                                                      │
│       ├── YES → Query real subgraph                         │
│       │                                                      │
│       └── NO  → Return MOCK_DATA  ← ← ← (Current state)     │
└─────────────────────────────────────────────────────────────┘
```

### Target Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Frontend                              │
├─────────────────────────────────────────────────────────────┤
│  Hooks (usePool, useTokens, etc.)                           │
│       │                                                      │
│       ▼                                                      │
│  GraphQL Client                                              │
│       │                                                      │
│       ▼                                                      │
│  The Graph (Hosted/Decentralized)                           │
│       │                                                      │
│       ▼                                                      │
│  Blockchain (Base Mainnet)                                  │
└─────────────────────────────────────────────────────────────┘
```

---

## Subgraph Deployment

### Prerequisites

1. The Graph CLI installed: `npm install -g @graphprotocol/graph-cli`
2. Deployed IGNIS contracts on Base
3. Graph Studio account (for decentralized) or Hosted Service access

### Step 1: Create Subgraph Project

```bash
# Clone your subgraph repo (assuming you have one)
git clone https://github.com/aurelia-protocol/ignis-subgraph
cd ignis-subgraph

# Or create new
graph init --studio ignis-base
```

### Step 2: Configure subgraph.yaml

```yaml
# subgraph.yaml
specVersion: 0.0.5
schema:
  file: ./schema.graphql
dataSources:
  - kind: ethereum
    name: GatewayRouter
    network: base
    source:
      address: "0x..." # Your GatewayRouterV5 address
      abi: GatewayRouterV5
      startBlock: 12345678 # Deployment block
    mapping:
      kind: ethereum/events
      apiVersion: 0.0.7
      language: wasm/assemblyscript
      entities:
        - Swap
        - User
        - Protocol
      abis:
        - name: GatewayRouterV5
          file: ./abis/GatewayRouterV5.json
      eventHandlers:
        - event: RouteExecuted(indexed address,indexed address,indexed address,uint256,uint256,uint256)
          handler: handleRouteExecuted
      file: ./src/gateway-router.ts

  - kind: ethereum
    name: BufferStaker
    network: base
    source:
      address: "0x..." # Your BufferStakerV2 address
      abi: BufferStakerV2
      startBlock: 12345678
    mapping:
      kind: ethereum/events
      apiVersion: 0.0.7
      language: wasm/assemblyscript
      entities:
        - StakerPosition
        - StakingPool
      abis:
        - name: BufferStakerV2
          file: ./abis/BufferStakerV2.json
      eventHandlers:
        - event: Staked(indexed address,indexed address,uint256)
          handler: handleStaked
        - event: Withdrawn(indexed address,indexed address,uint256)
          handler: handleWithdrawn
      file: ./src/buffer-staker.ts
```

### Step 3: Deploy Subgraph

```bash
# Authenticate (Graph Studio)
graph auth --studio YOUR_DEPLOY_KEY

# Build
graph codegen
graph build

# Deploy to Studio (Base mainnet)
graph deploy --studio ignis-base

# Or to Hosted Service
graph deploy --product hosted-service YOUR_GITHUB/ignis-base
```

### Step 4: Get Subgraph URL

After deployment, you'll get URLs like:
- **Studio:** `https://api.studio.thegraph.com/query/YOUR_ID/ignis-base/version/latest`
- **Hosted:** `https://api.thegraph.com/subgraphs/name/YOUR_GITHUB/ignis-base`

---

## Frontend Configuration

### Step 1: Update Environment Variables

```bash
# .env.local (development)
VITE_SUBGRAPH_URL_BASE=https://api.studio.thegraph.com/query/YOUR_ID/ignis-base/version/latest
VITE_SUBGRAPH_URL_BASE_SEPOLIA=https://api.studio.thegraph.com/query/YOUR_ID/ignis-base-sepolia/version/latest

# .env.production
VITE_SUBGRAPH_URL_BASE=https://gateway.thegraph.com/api/YOUR_API_KEY/subgraphs/id/YOUR_SUBGRAPH_ID
```

### Step 2: Update GraphQL Client

**File:** `src/lib/graphql/client.ts`

```typescript
// BEFORE (with TODO placeholders)
const SUBGRAPH_URLS: Record<number, string> = {
  8453: 'https://api.thegraph.com/subgraphs/name/TODO_REPLACE/ignis-base',
  84532: 'https://api.thegraph.com/subgraphs/name/TODO_REPLACE/ignis-base-sepolia',
};

// AFTER (with real URLs from env)
const SUBGRAPH_URLS: Record<number, string> = {
  8453: import.meta.env.VITE_SUBGRAPH_URL_BASE || '',
  84532: import.meta.env.VITE_SUBGRAPH_URL_BASE_SEPOLIA || '',
};

/**
 * Check if subgraph is configured for a chain
 */
export function isSubgraphConfigured(chainId: number): boolean {
  const url = SUBGRAPH_URLS[chainId];
  return !!url && !url.includes('TODO') && url.length > 0;
}
```

### Step 3: Update Environment Validation

**File:** `src/config/env.ts`

```typescript
// Add subgraph URL validation
VITE_SUBGRAPH_URL_BASE: z
  .string()
  .url('Must be a valid subgraph URL')
  .refine(
    (url) => !url.includes('TODO'),
    'Subgraph URL contains TODO placeholder'
  )
  .optional()
  .default(''),
```

---

## Hook-by-Hook Integration

### 1. usePools Hook

**File:** `src/hooks/subgraph/usePools.ts`

**Current behavior:** Returns `MOCK_CL_POOLS` and `MOCK_BIN_POOLS` when subgraph not configured.

**Changes needed:**

```typescript
// REMOVE these mock data constants (lines ~23-130)
// const MOCK_CL_POOLS: CLPool[] = [...];
// const MOCK_BIN_POOLS: BinPool[] = [...];

// UPDATE the hook to handle no-data state properly
export function useCLPools(chainId: number = 8453) {
  const [clPools, setClPools] = useState<CLPool[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchPools = async () => {
      // Check if subgraph is configured
      if (!isSubgraphConfigured(chainId)) {
        setError(new Error('Subgraph not configured for this network'));
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const response = await query<CLPoolsResponse>(
          chainId,
          CL_POOLS_QUERY,
          { first: 100 }
        );
        
        if (response.data?.clpools) {
          setClPools(response.data.clpools);
        }
      } catch (err) {
        setError(err as Error);
        logger.error('Failed to fetch CL pools', err);
      } finally {
        setLoading(false);
      }
    };

    fetchPools();
  }, [chainId]);

  return { clPools, loading, error, isEmpty: clPools.length === 0 };
}
```

**UI handling for no data:**

```tsx
// In PoolsPage.tsx
const { clPools, loading, error, isEmpty } = useCLPools(chainId);

if (error) {
  return <ErrorState message="Unable to load pools. Please try again." />;
}

if (isEmpty && !loading) {
  return <EmptyState message="No pools found on this network." />;
}
```

---

### 2. useTokens Hook

**File:** `src/hooks/subgraph/useTokens.ts`

**Changes:**

```typescript
// REMOVE mock tokens
// const MOCK_TOKENS: Token[] = [...];

// UPDATE hook
export function useTokens(chainId: number = 8453) {
  const [tokens, setTokens] = useState<Token[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchTokens = async () => {
      if (!isSubgraphConfigured(chainId)) {
        // Fallback to on-chain token registry
        const registryTokens = await fetchFromTokenRegistry(chainId);
        setTokens(registryTokens);
        setLoading(false);
        return;
      }

      try {
        const response = await query<TokensResponse>(chainId, TOKENS_QUERY);
        setTokens(response.data?.tokens || []);
      } catch (err) {
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    };

    fetchTokens();
  }, [chainId]);

  return { tokens, loading, error };
}

// Fallback to on-chain read if subgraph unavailable
async function fetchFromTokenRegistry(chainId: number): Promise<Token[]> {
  const publicClient = getPublicClient(chainId);
  const registryAddress = getContractAddress(chainId, 'tokenRegistry');
  
  const tokens = await publicClient.readContract({
    address: registryAddress,
    abi: ABIS.TokenRegistryV2,
    functionName: 'getAllTokens',
  });
  
  return tokens.map(formatToken);
}
```

---

### 3. useUser Hook

**File:** `src/hooks/subgraph/useUser.ts`

**Changes:**

```typescript
// REMOVE mock user data
// const MOCK_USER: User = {...};
// const MOCK_STAKER_POSITIONS: StakerPosition[] = [...];

export function useUser(address: string | undefined, chainId: number = 8453) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!address) {
      setUser(null);
      return;
    }

    const fetchUser = async () => {
      if (!isSubgraphConfigured(chainId)) {
        // Return minimal user object from on-chain data
        setUser({
          id: address.toLowerCase(),
          totalSwaps: '0',
          totalVolumeUSD: '0',
          // ... fetch from contract events or return defaults
        });
        return;
      }

      try {
        setLoading(true);
        const response = await query<UserResponse>(
          chainId,
          USER_QUERY,
          { id: address.toLowerCase() }
        );
        setUser(response.data?.user || null);
      } catch (err) {
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [address, chainId]);

  return { user, loading, error };
}
```

---

### 4. useProtocolStats Hook

**File:** `src/hooks/subgraph/useProtocolStats.ts`

**Changes:**

```typescript
// This hook is critical for the analytics page
export function useProtocolStats(chainId: number = 8453) {
  const [stats, setStats] = useState<Protocol | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      if (!isSubgraphConfigured(chainId)) {
        // Can't show protocol stats without subgraph
        setStats(null);
        setLoading(false);
        return;
      }

      try {
        const response = await query<ProtocolResponse>(chainId, PROTOCOL_QUERY);
        setStats(response.data?.protocols?.[0] || null);
      } catch (err) {
        logger.error('Failed to fetch protocol stats', err);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [chainId]);

  return { stats, loading, isConfigured: isSubgraphConfigured(chainId) };
}
```

---

## Migration Checklist

### For Each Hook:

- [ ] Remove `MOCK_*` constants
- [ ] Update `isSubgraphConfigured` check behavior
- [ ] Add proper error state handling
- [ ] Add loading state
- [ ] Add empty state handling
- [ ] Consider fallback to on-chain reads
- [ ] Update dependent components to handle new states

### Files to Update:

| File | Mock Data to Remove | Priority |
|------|---------------------|----------|
| `usePools.ts` | `MOCK_CL_POOLS`, `MOCK_BIN_POOLS` | 🔴 High |
| `useTokens.ts` | `MOCK_TOKENS` | 🔴 High |
| `useUser.ts` | `MOCK_USER`, `MOCK_STAKER_POSITIONS` | 🔴 High |
| `useVaults.ts` | `MOCK_VAULTS` | 🟡 Medium |
| `useProtocolStats.ts` | None (already queries) | 🟢 Low |
| `useStakingAndSwaps.ts` | `MOCK_SWAPS`, `MOCK_STAKES` | 🟡 Medium |

---

## Testing & Validation

### 1. Test Subgraph Queries

```bash
# Test in GraphQL playground
# Go to: https://api.studio.thegraph.com/query/YOUR_ID/ignis-base/version/latest

# Test pools query
query {
  clpools(first: 10, orderBy: totalValueLockedUSD, orderDirection: desc) {
    id
    token0 { symbol }
    token1 { symbol }
    totalValueLockedUSD
  }
}

# Test user query
query {
  user(id: "0xYOUR_ADDRESS") {
    id
    totalSwaps
    totalVolumeUSD
  }
}
```

### 2. Integration Test Script

```typescript
// scripts/test-subgraph-integration.ts
import { query, isSubgraphConfigured } from '../src/lib/graphql/client';

async function testIntegration() {
  const chainId = 8453; // Base mainnet
  
  console.log('Checking subgraph configuration...');
  console.log(`Configured: ${isSubgraphConfigured(chainId)}`);
  
  if (!isSubgraphConfigured(chainId)) {
    console.error('❌ Subgraph not configured!');
    process.exit(1);
  }
  
  console.log('\nTesting queries...');
  
  // Test protocol stats
  try {
    const protocol = await query(chainId, `{ protocols(first: 1) { id totalVolumeUSD } }`);
    console.log('✅ Protocol query:', protocol.data);
  } catch (e) {
    console.error('❌ Protocol query failed:', e);
  }
  
  // Test pools
  try {
    const pools = await query(chainId, `{ clpools(first: 5) { id } }`);
    console.log('✅ Pools query:', pools.data?.clpools?.length, 'pools');
  } catch (e) {
    console.error('❌ Pools query failed:', e);
  }
  
  // Test tokens
  try {
    const tokens = await query(chainId, `{ tokens(first: 5) { id symbol } }`);
    console.log('✅ Tokens query:', tokens.data?.tokens?.length, 'tokens');
  } catch (e) {
    console.error('❌ Tokens query failed:', e);
  }
  
  console.log('\n✅ Integration test complete!');
}

testIntegration();
```

### 3. Component Testing

```typescript
// Test that components handle all states
describe('PoolsPage', () => {
  it('shows loading state', () => {
    // Mock loading state
    render(<PoolsPage />);
    expect(screen.getByTestId('loading-skeleton')).toBeInTheDocument();
  });
  
  it('shows error state when subgraph fails', () => {
    // Mock error state
    render(<PoolsPage />);
    expect(screen.getByText(/unable to load/i)).toBeInTheDocument();
  });
  
  it('shows empty state when no pools', () => {
    // Mock empty response
    render(<PoolsPage />);
    expect(screen.getByText(/no pools found/i)).toBeInTheDocument();
  });
  
  it('renders pools when data available', () => {
    // Mock successful response
    render(<PoolsPage />);
    expect(screen.getByText('ETH/USDC')).toBeInTheDocument();
  });
});
```

---

## Troubleshooting

### Common Issues

#### 1. "Subgraph not configured" in production

**Cause:** Environment variable not set or not loaded.

**Fix:**
```bash
# Verify env var is set
echo $VITE_SUBGRAPH_URL_BASE

# Check it's in the build
grep -r "VITE_SUBGRAPH" dist/
```

#### 2. Queries returning empty data

**Cause:** Subgraph not fully indexed or no data on chain.

**Fix:**
```bash
# Check indexing status in Graph Studio
# Look for "Synced" status and block number

# Query the subgraph directly
curl -X POST YOUR_SUBGRAPH_URL \
  -H "Content-Type: application/json" \
  -d '{"query": "{ _meta { block { number } } }"}'
```

#### 3. CORS errors

**Cause:** Subgraph URL misconfigured or browser blocking.

**Fix:**
- Use Graph Studio URLs (they have CORS enabled)
- For self-hosted, configure CORS headers on your Graph Node

#### 4. Rate limiting

**Cause:** Too many requests to hosted service.

**Fix:**
```typescript
// Add request debouncing
const debouncedQuery = useMemo(
  () => debounce(query, 300),
  []
);

// Or use React Query's built-in caching
const { data } = useQuery({
  queryKey: ['pools', chainId],
  queryFn: () => fetchPools(chainId),
  staleTime: 30000, // Cache for 30 seconds
});
```

#### 5. Type mismatches

**Cause:** Subgraph schema doesn't match TypeScript types.

**Fix:**
```bash
# Generate types from subgraph schema
npm install -D @graphql-codegen/cli @graphql-codegen/typescript

# graphql-codegen.yml
schema: YOUR_SUBGRAPH_URL
generates:
  src/lib/graphql/generated.ts:
    plugins:
      - typescript
      - typescript-operations
```

---

## Performance Optimization

### 1. Query Batching

```typescript
// Batch multiple queries into one request
const COMBINED_QUERY = gql`
  query DashboardData($userAddress: ID!) {
    protocol(id: "1") {
      totalVolumeUSD
      totalUsers
    }
    user(id: $userAddress) {
      totalSwaps
      positions { id }
    }
    clpools(first: 10, orderBy: totalValueLockedUSD, orderDirection: desc) {
      id
      token0 { symbol }
      token1 { symbol }
    }
  }
`;
```

### 2. Pagination

```typescript
// Use cursor-based pagination for large datasets
const POOLS_PAGINATED = gql`
  query Pools($first: Int!, $skip: Int!) {
    clpools(first: $first, skip: $skip, orderBy: totalValueLockedUSD, orderDirection: desc) {
      id
      # ... fields
    }
  }
`;

// In hook
const [page, setPage] = useState(0);
const { data } = useQuery({
  queryKey: ['pools', page],
  queryFn: () => query(chainId, POOLS_PAGINATED, { first: 20, skip: page * 20 }),
});
```

### 3. Caching Strategy

```typescript
// Configure React Query for optimal caching
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30 * 1000, // 30 seconds
      cacheTime: 5 * 60 * 1000, // 5 minutes
      refetchOnWindowFocus: false,
      retry: 2,
    },
  },
});
```

---

## Rollback Plan

If subgraph integration causes issues:

1. **Quick fix:** Re-enable mock data fallback
```typescript
if (!isSubgraphConfigured(chainId) || USE_MOCK_DATA) {
  return MOCK_DATA;
}
```

2. **Feature flag:** Add environment variable
```bash
VITE_USE_MOCK_DATA=true
```

3. **Revert:** Keep mock data in codebase but unused until stable

---

## Summary

| Step | Action | Time |
|------|--------|------|
| 1 | Deploy subgraph | 2-4 hours |
| 2 | Configure env vars | 30 min |
| 3 | Update GraphQL client | 1 hour |
| 4 | Update hooks (6 files) | 4-6 hours |
| 5 | Update UI for new states | 2-3 hours |
| 6 | Testing | 2-3 hours |
| **Total** | | **12-18 hours** |
