# Types

TypeScript type definitions.

## Usage

```ts
import type { Token, Pool, SwapQuote, Position } from '@/types';
```

## Core Types

### Token

```ts
interface Token {
  symbol: string;
  name: string;
  address: Address;
  decimals: number;
  chainId: number;
  logoURI?: string;
  isNative?: boolean;
  isStable?: boolean;
  isYieldBearing?: boolean;
}
```

### Pool

```ts
interface Pool {
  id: Address;
  type: 'CL' | 'BIN';
  token0: Token;
  token1: Token;
  fee: number;
  tvl: number;
  volume24h: number;
  apr: number;
}
```

### SwapQuote

```ts
interface SwapQuote {
  expectedAmountOut: bigint;
  minAmountOut: bigint;
  priceImpact: number;
  route: EncodedRoute;
  gasEstimate: bigint;
}
```

### Position

```ts
interface Position {
  id: string;
  pool: Pool;
  liquidity: bigint;
  token0Amount: bigint;
  token1Amount: bigint;
  tickLower?: number;
  tickUpper?: number;
  inRange: boolean;
}
```

## Component Props

Modal props, component props are also defined here:

```ts
interface TokenSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (token: Token) => void;
  selectedToken?: Token;
  otherToken?: Token;
}
```

## Adding Types

Add new types to `index.ts` and export them.

Keep types close to usage - if only used in one file, define there instead.
