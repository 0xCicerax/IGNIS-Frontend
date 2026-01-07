# 🔥 IGNIS DEX - Deployment Integration Guide

## Quick Start

The frontend is **100% functional in demo mode** - all features work with mock data.
When you deploy contracts, patch in the addresses and it will automatically switch to live mode.

---

## 📍 Where to Patch What

### STEP 1: Deploy Contracts → Patch `src/config/contracts.js`

After running `deploy-all.ts`, you'll get contract addresses. Paste them here:

```javascript
// src/config/contracts.js - Lines 45-70 (Base Sepolia section)

contracts: {
  // Core Protocol
  vaultAdapter:     '0xYOUR_VAULT_ADAPTER_ADDRESS',    // Script 11
  quoter:           '0xYOUR_QUOTER_ADDRESS',           // Script 15
  router:           '0xYOUR_ROUTER_ADDRESS',           // Script 13
  buffer:           '0xYOUR_BUFFER_ADDRESS',           // Script 12
  staker:           '0xYOUR_STAKER_ADDRESS',           // Script 17
  
  // Registries
  tokenRegistry:    '0xYOUR_TOKEN_REGISTRY_ADDRESS',   // Script 09
  poolRegistry:     '0xYOUR_POOL_REGISTRY_ADDRESS',    // Script 12b
  gatewayRegistry:  '0xYOUR_GATEWAY_REGISTRY_ADDRESS', // Script 10
  
  // ... etc
}
```

**Mapping from deploy script output:**

| Deploy Script | Output Name | Config Field |
|---------------|-------------|--------------|
| `11_aurelia_vault_adapter.ts` | AureliaVaultAdapter | `vaultAdapter` |
| `15_aurelia_smart_quoter.ts` | AureliaSmartQuoterV5 | `quoter` |
| `13_aurelia_gateway_router.ts` | GatewayRouterV5 | `router` |
| `12_aurelia_gateway_buffer.ts` | Gateway4626Buffer | `buffer` |
| `17_aurelia_buffer_staker.ts` | BufferStakerV2 | `staker` |
| `09_aurelia_token_registry.ts` | TokenRegistryV2 | `tokenRegistry` |
| `12b_aurelia_pool_registry.ts` | PoolRegistry | `poolRegistry` |
| `10_aurelia_gateway_registry.ts` | GatewayRegistry | `gatewayRegistry` |
| `18_aurelia_gateway_keeper.ts` | GatewayKeeper | `keeper` |
| `16_aurelia_aggregator_adapter.ts` | AureliaAggregatorAdapter | `aggregatorAdapter` |

---

### STEP 2: Deploy Test Tokens → Patch `src/config/tokens.js`

After deploying mock tokens for testnet:

```javascript
// src/config/tokens.js - TESTNET_TOKENS section

USDC: {
  address: '0xYOUR_MOCK_USDC_ADDRESS',  // ← Paste here
  symbol: 'USDC',
  // ...
},
```

---

### STEP 3: Deploy Subgraph → Patch `src/config/contracts.js`

After deploying your subgraph to The Graph:

```javascript
// src/config/contracts.js - Line 75 (subgraph section)

subgraph: {
  url: 'https://api.studio.thegraph.com/query/YOUR_ID/ignis-sepolia/version/latest',
}
```

---

### STEP 4: Switch to Mainnet → Change `IS_TESTNET`

```javascript
// src/config/contracts.js - Line 32

export const IS_TESTNET = false;  // Change to false for mainnet
```

Then fill in the `CHAINS.base.contracts` section with mainnet addresses.

---

## 📁 File Structure

```
src/
├── abis/                          # Contract ABIs (already populated)
│   ├── index.js                   # Easy imports
│   ├── AureliaVaultAdapter.json   # Main swap entry point
│   ├── AureliaSmartQuoterV5.json  # Quote engine
│   ├── GatewayRouterV5.json       # Route execution
│   ├── Gateway4626Buffer.json     # Wrap/unwrap buffer
│   ├── BufferStakerV2.json        # Staking
│   ├── ERC20.json                 # Token standard
│   ├── ERC4626.json               # Vault standard
│   └── ... (12 more ABIs)
│
├── config/
│   ├── index.js                   # All config exports
│   ├── contracts.js               # PATCH: Contract addresses
│   ├── tokens.js                  # PATCH: Token addresses
│   ├── protocols.js               # Protocol API configs (Aave, Lido, etc.)
│   └── wagmi.js                   # Wallet config
│
├── services/                      # ⭐ NEW: Backend services
│   ├── index.js                   # All service exports
│   ├── priceService.js            # Token price fetching
│   ├── vaultYieldService.js       # Vault APY fetching
│   ├── aprService.js              # Pool APR calculations
│   └── analyticsService.js        # Historical data
│
├── hooks/
│   ├── index.js                   # All hook exports
│   ├── useContracts.js            # Contract interaction hooks
│   ├── useAnalytics.js            # ⭐ NEW: APR & analytics hooks
│   └── ...
│
└── data/
    ├── tokens.js                  # Demo token data
    └── pools.js                   # Demo pool data
```

---

## 📊 APR Calculation System

### How Pool APR Works

```
┌─────────────────────────────────────────────────────────────────────┐
│                        TOTAL POOL APR                                │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  1. TRADING FEE APR                                                  │
│     Formula: (24h Volume × Fee Rate × 365) / TVL                    │
│     Source:  Subgraph (dailyVolumes)                                │
│                                                                      │
│  2. VAULT YIELD APR                                                  │
│     Formula: (Token0 APY × 50%) + (Token1 APY × 50%)                │
│     Sources: DeFiLlama Yields API, Protocol APIs                    │
│                                                                      │
│  3. IGNI REWARDS APR                                                 │
│     Formula: (Daily IGNI × IGNI Price × 365) / TVL                  │
│     Source:  BufferStaker contract                                  │
│                                                                      │
│  ═══════════════════════════════════════════════════════════════════│
│  TOTAL APR = Fee APR + Vault APR + Rewards APR                      │
└─────────────────────────────────────────────────────────────────────┘
```

### Using APR Hooks

```jsx
import { usePoolAPR, usePoolAPRs, formatAPR } from '../hooks';

// Single pool APR
function PoolCard({ pool }) {
  const { apr, isLoading } = usePoolAPR(pool);
  
  if (isLoading) return <Skeleton />;
  
  return (
    <div>
      <span>Total APR: {formatAPR(apr.totalAPR)}</span>
      <span>Fee APR: {formatAPR(apr.breakdown.feeAPR)}</span>
      <span>Vault APR: {formatAPR(apr.breakdown.vaultAPR)}</span>
      <span>Rewards: {formatAPR(apr.breakdown.rewardsAPR)}</span>
    </div>
  );
}

// Multiple pools
function PoolsTable({ pools }) {
  const { aprs, isLoading } = usePoolAPRs(pools);
  
  return pools.map(pool => (
    <tr key={pool.id}>
      <td>{pool.name}</td>
      <td>{aprs[pool.id] ? formatAPR(aprs[pool.id].totalAPR) : '-'}</td>
    </tr>
  ));
}
```

### Price & Yield Hooks

```jsx
import { 
  useTokenPrices, 
  useVaultYield,
  useTVLHistory,
  useVolumeHistory,
  useMEVStats,
} from '../hooks';

// Token prices
function PriceDisplay() {
  const { prices, isLoading } = useTokenPrices(['ETH', 'USDC', 'IGNI']);
  return <span>ETH: ${prices.ETH?.price}</span>;
}

// Vault yield
function VaultYield({ symbol }) {
  const { yield: yieldData } = useVaultYield(symbol);
  return <span>{symbol} APY: {yieldData?.apy}%</span>;
}

// Historical data
function TVLChart() {
  const { history, current, change } = useTVLHistory(30);
  // Use history array for chart
}

// MEV stats
function MEVDashboard() {
  const { stats } = useMEVStats(30);
  return <span>Captured: ${stats?.totalCaptured}</span>;
}
```

---

## 🔄 Data Flow

```
┌──────────────────────────────────────────────────────────────────────┐
│                         DATA SOURCES                                  │
├──────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  PRICES                    YIELDS                   ON-CHAIN          │
│  ┌─────────────────┐      ┌─────────────────┐      ┌──────────────┐  │
│  │ DeFiLlama       │      │ DeFiLlama Yields│      │ Subgraph     │  │
│  │ CoinGecko       │      │ Aave API        │      │ Contracts    │  │
│  │ DexScreener     │      │ Lido API        │      │              │  │
│  │ (fallbacks)     │      │ (fallbacks)     │      │              │  │
│  └────────┬────────┘      └────────┬────────┘      └──────┬───────┘  │
│           │                        │                       │          │
│           ▼                        ▼                       ▼          │
│  ┌──────────────────────────────────────────────────────────────┐    │
│  │                      SERVICES LAYER                           │    │
│  │  priceService → vaultYieldService → aprService → analytics   │    │
│  └──────────────────────────────────────────────────────────────┘    │
│                                │                                      │
│                                ▼                                      │
│  ┌──────────────────────────────────────────────────────────────┐    │
│  │                       REACT HOOKS                             │    │
│  │  useTokenPrices, useVaultYield, usePoolAPR, useTVLHistory    │    │
│  └──────────────────────────────────────────────────────────────┘    │
│                                │                                      │
│                                ▼                                      │
│  ┌──────────────────────────────────────────────────────────────┐    │
│  │                       UI COMPONENTS                           │    │
│  │  PoolsPage, AnalyticsPage, SwapPage, StakePage               │    │
│  └──────────────────────────────────────────────────────────────┘    │
│                                                                       │
└──────────────────────────────────────────────────────────────────────┘
```

---

## 🔄 Demo vs Live Mode

| Mode | Trigger | Behavior |
|------|---------|----------|
| **Demo** | `vaultAdapter = 0x000...` | Mock prices, simulated APRs, demo history |
| **Live** | Real addresses deployed | Real API calls, subgraph queries, live data |

The hooks automatically detect this - no code changes needed!

---

## 📋 Deployment Checklist

### Testnet (Base Sepolia)

```bash
# 1. Deploy contracts
cd scripts/deploy
cp .env.example .env
# Fill in: PRIVATE_KEY, RPC_URL=https://sepolia.base.org
npx hardhat run deploy-all.ts --network baseSepolia

# 2. Copy addresses to src/config/contracts.js (CHAINS.baseSepolia.contracts)

# 3. Deploy subgraph
cd subgraph
# Update subgraph.yaml with contract addresses
graph deploy --studio ignis-sepolia

# 4. Copy subgraph URL to src/config/contracts.js

# 5. Build and deploy frontend
npm run build
# Deploy dist/ to Vercel/Netlify
```

---

## 📊 Available Hooks Reference

### Price Hooks
| Hook | Returns | Description |
|------|---------|-------------|
| `useTokenPrices(symbols)` | `{ prices, isLoading }` | Multiple token prices |
| `useTokenPrice(symbol)` | `{ price, isLoading }` | Single token price |
| `usePriceHistory(symbol, days)` | `{ history }` | Historical prices |

### Yield Hooks
| Hook | Returns | Description |
|------|---------|-------------|
| `useVaultYield(symbol)` | `{ yield, isLoading }` | Vault APY |
| `useAllVaultYields()` | `{ yields }` | All vault APYs |

### APR Hooks
| Hook | Returns | Description |
|------|---------|-------------|
| `usePoolAPR(pool)` | `{ apr, isLoading }` | Single pool APR |
| `usePoolAPRs(pools)` | `{ aprs, isLoading }` | Multiple pool APRs |
| `useProtocolAPRStats()` | `{ stats }` | Protocol-wide APR stats |
| `usePoolAPRHistory(poolId, days)` | `{ history }` | Historical APR |

### Analytics Hooks
| Hook | Returns | Description |
|------|---------|-------------|
| `useTVLHistory(days)` | `{ history, current, change }` | TVL over time |
| `useVolumeHistory(days)` | `{ history, total, today }` | Volume over time |
| `useProtocolMetrics()` | `{ metrics }` | Total stats |
| `useTopPools(sortBy, limit)` | `{ pools }` | Top pools |
| `useRecentSwaps(limit)` | `{ swaps }` | Recent activity |
| `useMEVStats(days)` | `{ stats }` | MEV capture data |
| `useDashboardData()` | All above combined | Dashboard data |

---

## 🔗 Resources

- [Frontend Integration Guide](../IGNIS-contracts/docs/FRONTEND_INTEGRATION.md)
- [API Reference](../IGNIS-contracts/docs/addendums/ADDENDUM_C_API_REFERENCE.md)
- [Subgraph Schema](../IGNIS-contracts/subgraph/schema.graphql)
- [Deploy Scripts](../IGNIS-contracts/scripts/deploy/)
