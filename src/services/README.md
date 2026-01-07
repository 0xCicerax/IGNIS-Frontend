# Services

External data services and utilities.

## Overview

Services handle external API calls, caching, and data aggregation. They're used by hooks but can be called directly for non-React contexts.

```
services/
├── priceService      # Token prices (DeFiLlama, CoinGecko)
├── aprService        # APR calculations
├── vaultYieldService # Vault yield data
├── gasEstimator      # Gas price estimation
└── analyticsService  # Protocol analytics
```

## Price Service

Fetches token prices with fallback sources and caching.

```ts
import { priceService } from '@/services';

// Single price
const ethPrice = await priceService.getPrice('ethereum');

// Multiple prices
const prices = await priceService.getPrices([
  'ethereum',
  'usd-coin', 
  'wrapped-bitcoin'
]);

// By address
const price = await priceService.getPriceByAddress(
  '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48', // USDC
  'ethereum' // chain
);

// Historical
const history = await priceService.getHistoricalPrices(
  'ethereum',
  '7d' // 1d, 7d, 30d, 90d, 1y
);
```

Sources (in order): DeFiLlama → CoinGecko → cache fallback

Cache TTL: 60s for current prices, 5min for historical

## APR Service

Calculates pool APRs from multiple sources.

```ts
import { aprService } from '@/services';

// Pool APR breakdown
const apr = await aprService.getPoolAPR(poolId);
// {
//   trading: 8.5,      // from fees
//   rewards: 12.0,     // IGNIS emissions
//   vault: 4.2,        // underlying vault yield (if applicable)
//   total: 24.7
// }

// Batch fetch
const aprs = await aprService.getPoolAPRs(poolIds);
```

## Vault Yield Service

Fetches yield data for ERC-4626 vaults.

```ts
import { vaultYieldService } from '@/services';

// Get vault APY
const apy = await vaultYieldService.getVaultAPY(vaultAddress);

// Get all tracked vaults
const vaults = await vaultYieldService.getAllVaultYields();
// [{ address, apy, tvl, protocol }, ...]
```

Data source: DeFiLlama yields API

## Gas Estimator

Estimates gas costs for transactions.

```ts
import { gasEstimator } from '@/services';

// Current gas price
const gasPrice = await gasEstimator.getGasPrice();
// { fast, standard, slow } in gwei

// Estimate swap cost
const cost = await gasEstimator.estimateSwapCost({
  route: encodedRoute,
  gasLimit: 250000,
});
// { gasLimit, gasPrice, totalGwei, totalUsd }
```

## Analytics Service

Aggregates protocol metrics.

```ts
import { analyticsService } from '@/services';

// Protocol stats
const stats = await analyticsService.getProtocolStats();
// { tvl, volume24h, fees24h, txCount24h }

// Historical TVL
const tvlHistory = await analyticsService.getTVLHistory('30d');
// [{ date, tvl }, ...]

// Top pools
const topPools = await analyticsService.getTopPools(10, 'volume');
```

## Caching

All services use localStorage caching with TTL:

```ts
// Cache is automatic, but can force refresh:
const price = await priceService.getPrice('ethereum', { 
  forceRefresh: true 
});
```

Cache keys are prefixed: `ignis_price_`, `ignis_apr_`, etc.

## Error Handling

Services throw typed errors:

```ts
try {
  const price = await priceService.getPrice('unknown-token');
} catch (err) {
  if (err.code === 'TOKEN_NOT_FOUND') {
    // handle
  }
}
```

Common error codes:
- `TOKEN_NOT_FOUND`
- `NETWORK_ERROR`
- `RATE_LIMITED`
- `INVALID_RESPONSE`

## Adding Services

1. Create service file with class or object pattern
2. Add caching for external calls
3. Add to `index.ts` exports
4. Use `logger` from `@/utils` for errors
