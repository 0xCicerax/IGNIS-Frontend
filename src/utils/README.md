# Utils

Utility functions.

## Modules

| File | Purpose |
|------|---------|
| `format.ts` | Number, currency, address formatting |
| `charts.ts` | Chart data transformations |
| `logger.ts` | Production-safe logging |
| `errorMessages.ts` | User-friendly error messages |
| `toast.tsx` | Toast notifications |

## Formatting

```ts
import { 
  formatUsd, 
  formatNumber, 
  formatPercent,
  formatAddress,
  formatTokenAmount,
} from '@/utils';

formatUsd(1234567.89)        // "$1,234,567.89"
formatUsd(1234567.89, true)  // "$1.23M"

formatNumber(1234.5678, 2)   // "1,234.57"
formatNumber(0.00001234, 6)  // "0.000012"

formatPercent(0.1234)        // "12.34%"
formatPercent(0.1234, 1)     // "12.3%"

formatAddress('0x1234...5678')  // "0x1234...5678"
formatAddress('0x...', 6)       // "0x1234...567890"

formatTokenAmount(1234567890n, 18)     // "1.23"
formatTokenAmount(1234567890n, 18, 6)  // "1.234567"
```

## Charts

Transform data for Recharts:

```ts
import { 
  formatChartData,
  calculateMA,
  normalizeTimeseries,
} from '@/utils/charts';

// Format for line chart
const data = formatChartData(rawPrices, {
  xKey: 'timestamp',
  yKey: 'price',
  dateFormat: 'MMM dd',
});

// Add moving average
const withMA = calculateMA(data, 7, 'price');

// Normalize to percentage change
const normalized = normalizeTimeseries(data, 'price');
```

## Logger

Production-safe logging with Sentry integration:

```ts
import { logger } from '@/utils';

logger.debug('Swap details', { from, to, amount });  // Dev only
logger.info('User connected', { address });          // Dev only
logger.warn('High slippage', { slippage });          // Always
logger.error('Swap failed', error, { txHash });      // Always + Sentry

// Scoped loggers
import { swapLogger, poolLogger } from '@/utils/logger';
swapLogger.debug('Quote received', { quote });
```

In production, only `warn` and `error` are logged.

## Error Messages

Map errors to user-friendly messages:

```ts
import { getErrorMessage } from '@/utils';

try {
  await swap();
} catch (err) {
  const message = getErrorMessage(err);
  toast.error(message);
}
```

Handles:
- Contract reverts (custom errors)
- Wallet rejections
- Network errors
- Timeout errors

## Toasts

```tsx
import { toast } from '@/utils';

toast.success('Swap complete!');
toast.error('Transaction failed');
toast.info('Waiting for confirmation...');
toast.loading('Swapping...', { id: 'swap' });
toast.dismiss('swap');

// With TX link
toast.success(
  <span>
    Swap complete! <a href={getTxUrl(hash)}>View</a>
  </span>
);
```

Uses react-hot-toast under the hood.
