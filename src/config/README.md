# Config

Application configuration.

## Files

| File | Purpose |
|------|---------|
| `env.ts` | Environment variables with validation |
| `contracts.ts` | Contract addresses per chain |
| `tokens.ts` | Token registry |
| `protocols.ts` | Protocol/vault definitions |
| `wagmi.ts` | Chain configuration |

## Environment

`env.ts` validates and exports env vars:

```ts
import { env } from '@/config';

env.VITE_RPC_URL        // Required
env.VITE_CHAIN_ID       // Required
env.VITE_SUBGRAPH_URL   // Optional
env.VITE_SENTRY_DSN     // Optional
```

Uses Zod for validation. App won't start with invalid config.

### Required Variables

```bash
VITE_RPC_URL=https://arb1.arbitrum.io/rpc
VITE_CHAIN_ID=42161
```

### Optional Variables

```bash
VITE_SUBGRAPH_URL=https://api.thegraph.com/...
VITE_SENTRY_DSN=https://...@sentry.io/...
VITE_WALLETCONNECT_PROJECT_ID=...
```

## Contracts

`contracts.ts` has per-chain addresses:

```ts
import { getContractAddress, SUPPORTED_CHAINS } from '@/config';

// Get for current chain
const router = getContractAddress('GatewayRouter');

// Check support
if (SUPPORTED_CHAINS.includes(chainId)) {
  // ...
}
```

To add a new chain:
1. Add chain config to `wagmi.ts`
2. Add addresses to `contracts.ts`
3. Add to `SUPPORTED_CHAINS`

## Tokens

`tokens.ts` has the token registry:

```ts
import { TOKENS, getToken, getNativeToken } from '@/config';

// All tokens
TOKENS.forEach(t => console.log(t.symbol));

// By symbol
const usdc = getToken('USDC');

// Native token for chain
const eth = getNativeToken(42161);
```

Token shape:
```ts
{
  symbol: 'USDC',
  name: 'USD Coin',
  address: '0x...',
  decimals: 6,
  chainId: 42161,
  logoURI: '...',
  isNative: false,
  isStable: true,
}
```

## Protocols

`protocols.ts` defines integrated protocols:

```ts
import { PROTOCOLS, getProtocol } from '@/config';

const aave = getProtocol('aave-v3');
// { id, name, vaults: [...], color, logo }
```

Used for vault token display and yield attribution.

## Adding Config

Environment vars: Add to `.env`, add to Zod schema in `env.ts`

Tokens: Add to `TOKENS` array in `tokens.ts`

Contracts: Add to chain object in `contracts.ts`

Chains: Add to `wagmi.ts` and `contracts.ts`
