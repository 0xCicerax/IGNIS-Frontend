# Hooks

React hooks for IGNIS protocol interactions.

## Structure

```
hooks/
├── contracts/      # Direct contract interactions (write ops)
├── subgraph/       # GraphQL data fetching (read ops)
├── useSwapQuote    # Quote fetching with caching
├── useDepth        # Orderbook depth polling
├── useSettings     # User preferences (slippage, deadline)
└── ...
```

## Quick Start

```tsx
import { useSwapQuote, useSettings, useSwap } from '@/hooks';

function SwapForm() {
  const { slippage } = useSettings();
  const { quote, isLoading } = useSwapQuote(fromToken, toToken, amount);
  const { execute, isPending } = useSwap();

  const handleSwap = () => {
    execute({
      route: quote.route,
      minOut: quote.minAmountOut,
      deadline: Math.floor(Date.now() / 1000) + 1800,
    });
  };
}
```

## Contract Hooks

Located in `contracts/`. These handle write operations.

### useSwap

Execute swaps through the router.

```tsx
const { execute, isPending, txHash, error, reset } = useSwap();

// Basic swap
await execute({
  route: encodedRoute,
  minAmountOut: parseUnits('100', 6),
  deadline: Math.floor(Date.now() / 1000) + 1800,
});

// With callbacks
await execute(params, {
  onSuccess: (hash) => toast.success(`TX: ${hash}`),
  onError: (err) => toast.error(err.message),
});
```

### useToken

Token approvals and balances.

```tsx
const { 
  balance,
  allowance,
  approve,
  isApproving,
} = useToken(tokenAddress, spenderAddress);

// Check if approval needed
if (allowance < amount) {
  await approve(amount); // or approve(MaxUint256) for infinite
}
```

### useBuffer

Wrap/unwrap vault tokens.

```tsx
const { wrap, unwrap, isPending } = useBuffer(vaultAddress);

// Wrap underlying -> vault token
await wrap(parseUnits('100', 18));

// Unwrap vault token -> underlying
await unwrap(parseUnits('50', 18));
```

### useStaking

Stake buffer tokens for rewards.

```tsx
const { 
  stake, 
  unstake, 
  claim,
  stakedBalance,
  pendingRewards,
} = useStaking(poolId);

await stake(amount, lockDuration);
await claim();
await unstake(positionId);
```

## Data Hooks

### useSwapQuote

Fetches quotes with debouncing and caching.

```tsx
const {
  quote,           // { expectedOut, minOut, priceImpact, route, ... }
  isLoading,
  error,
  refetch,
} = useSwapQuote(fromToken, toToken, amountIn, {
  slippage: 0.5,   // percent
  enabled: true,   // set false to disable
});
```

The hook:
- Debounces requests (300ms default)
- Caches quotes for 10s
- Auto-retries on failure (3x with backoff)
- Returns `null` quote when amount is empty/zero

### useDepth

Polls orderbook depth from PoolDepthReader contract.

```tsx
const {
  depth,           // { bids, asks, currentPrice, timestamp }
  isLoading,
  error,
} = useDepth({
  token0: WETH,
  token1: USDC,
  pollInterval: 15000,  // ms, default 15s
  enabled: true,
});
```

For batch fetching multiple pools:

```tsx
import { DepthReaderService } from '@/hooks/useDepth';

const service = new DepthReaderService(contractAddr, rpcUrl);
const { clSnapshots, binSnapshots } = await service.getBatchDepth(
  clPoolIds,
  binPoolIds,
  50  // items per side
);
```

### useSettings

User preferences persisted to localStorage.

```tsx
const {
  slippage,
  setSlippage,
  deadline,
  setDeadline,
  expertMode,
  setExpertMode,
} = useSettings();
```

## Subgraph Hooks

Located in `subgraph/`. All follow the same pattern:

```tsx
const { data, isLoading, error, refetch } = useXxx(params);
```

### Available hooks

| Hook | Returns |
|------|---------|
| `usePools()` | All pools with TVL, volume, APR |
| `usePool(id)` | Single pool details |
| `useTokens()` | Token list with prices |
| `useUser(address)` | User positions, history |
| `useProtocolStats()` | TVL, volume, fees |
| `useVaults()` | Vault tokens and yields |
| `useStakingPools()` | Staking pool info |
| `useRecentSwaps(n)` | Latest n swaps |

### Pagination

```tsx
const { data, fetchMore, hasMore } = usePools({
  first: 20,
  orderBy: 'tvl',
  orderDirection: 'desc',
});

// Load more
if (hasMore) {
  fetchMore();
}
```

## Patterns

### Combining hooks

```tsx
function PoolPage({ poolId }) {
  const { data: pool } = usePool(poolId);
  const { depth } = useDepth({ 
    token0: pool?.token0, 
    token1: pool?.token1,
    enabled: !!pool,
  });
  const { data: swaps } = usePoolSwaps(poolId, { first: 10 });
  
  // ...
}
```

### Optimistic updates

```tsx
const queryClient = useQueryClient();
const { execute } = useSwap();

const handleSwap = async () => {
  // Optimistic balance update
  queryClient.setQueryData(['balance', tokenAddress], (old) => 
    old - amountIn
  );
  
  try {
    await execute(params);
  } catch {
    // Revert on failure
    queryClient.invalidateQueries(['balance', tokenAddress]);
  }
};
```

### Error handling

All hooks expose errors consistently:

```tsx
const { error } = useSwapQuote(...);

if (error) {
  if (error.code === 'INSUFFICIENT_LIQUIDITY') {
    // Handle specific error
  }
  toast.error(getErrorMessage(error));
}
```

See `utils/errorMessages.ts` for user-friendly messages.

## Testing

Hooks are tested with mock providers:

```tsx
import { renderHook, waitFor } from '@testing-library/react';
import { useSwapQuote } from './useSwapQuote';

test('fetches quote', async () => {
  const { result } = renderHook(() => 
    useSwapQuote(ETH, USDC, '1.0')
  );
  
  await waitFor(() => {
    expect(result.current.quote).not.toBeNull();
  });
});
```

See `test/hooks.test.ts` for examples.
