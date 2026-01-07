# Lib

Core libraries and configurations.

## Structure

```
lib/
├── contracts/     # Contract interaction utilities
├── graphql/       # Subgraph client and queries
├── wagmi.ts       # Wallet config
├── queryClient.ts # React Query config
└── sentry.ts      # Error tracking
```

## Contracts

Contract addresses, ABIs, and utilities.

```ts
import { 
  getContractAddress,
  isContractConfigured,
  ABIS 
} from '@/lib/contracts';

// Get address for current chain
const routerAddr = getContractAddress('GatewayRouter');

// Check if deployed
if (!isContractConfigured('BufferStaker')) {
  console.log('Staking not available on this chain');
}

// Use ABI
const router = new Contract(routerAddr, ABIS.GatewayRouterV5, signer);
```

### Addresses

`addresses.ts` exports per-chain contract addresses:

```ts
const ADDRESSES = {
  42161: { // Arbitrum
    GatewayRouter: '0x...',
    SmartQuoter: '0x...',
    // ...
  },
  421614: { // Arbitrum Sepolia
    // ...
  }
};
```

### Error Handling

`errors.ts` provides error parsing:

```ts
import { parseContractError, getErrorMessage } from '@/lib/contracts';

try {
  await router.swap(...);
} catch (err) {
  const parsed = parseContractError(err);
  toast.error(getErrorMessage(parsed));
}
```

### Validation

`validation.ts` for pre-flight checks:

```ts
import { validateSwapParams } from '@/lib/contracts';

const { valid, error } = validateSwapParams({
  fromToken,
  toToken,
  amount,
  minOut,
  deadline,
});

if (!valid) {
  throw new Error(error);
}
```

## GraphQL

Subgraph client and queries.

```ts
import { query, isSubgraphConfigured } from '@/lib/graphql';
import { POOLS_QUERY, POOL_QUERY } from '@/lib/graphql/queries';

// Check availability
if (!isSubgraphConfigured()) {
  // Fall back to RPC calls
}

// Execute query
const { pools } = await query(POOLS_QUERY, {
  first: 20,
  orderBy: 'tvl',
  orderDirection: 'desc',
});
```

Queries are in `queries.ts`, types in `types.ts`.

## Wagmi

Wallet connection config.

```ts
// lib/wagmi.ts
import { createConfig, http } from 'wagmi';
import { arbitrum, arbitrumSepolia } from 'wagmi/chains';

export const config = createConfig({
  chains: [arbitrum, arbitrumSepolia],
  transports: {
    [arbitrum.id]: http(),
    [arbitrumSepolia.id]: http(),
  },
});
```

Used in app root:

```tsx
import { config } from '@/lib/wagmi';
import { WagmiProvider } from 'wagmi';

<WagmiProvider config={config}>
  <App />
</WagmiProvider>
```

## Query Client

React Query configuration.

```ts
// lib/queryClient.ts
import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      gcTime: 5 * 60_000,
      retry: 2,
      refetchOnWindowFocus: false,
    },
  },
});
```

## Sentry

Error tracking setup.

```ts
import { captureError, captureMessage, addBreadcrumb } from '@/lib/sentry';

// Track error
captureError(error, { context: 'swap' });

// Track event
captureMessage('Swap completed', 'info', { txHash });

// Add breadcrumb for debugging
addBreadcrumb('User clicked swap', 'ui');
```

Initialization in `main.tsx`:

```tsx
import { initSentry } from '@/lib/sentry';

initSentry({
  dsn: import.meta.env.VITE_SENTRY_DSN,
  environment: import.meta.env.MODE,
});
```
