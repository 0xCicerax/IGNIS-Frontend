# Components

UI components for IGNIS.

## Structure

```
components/
├── ui/          # Base primitives (Button, Card, Modal, Input)
├── shared/      # Reusable composed components
├── swap/        # Swap-specific components
├── charts/      # Chart components
├── modals/      # Modal dialogs
└── layout/      # Header, Footer
```

## UI Components

Low-level building blocks. Import from `@/components/ui`.

```tsx
import { Button, Card, Modal, Input, TokenIcon } from '@/components/ui';
```

### Button

```tsx
<Button variant="primary" size="lg" onClick={handleClick}>
  Swap
</Button>

<Button variant="secondary" disabled={isLoading}>
  {isLoading ? 'Loading...' : 'Connect'}
</Button>

<Button variant="ghost" size="sm">
  Settings
</Button>
```

Variants: `primary`, `secondary`, `ghost`, `danger`
Sizes: `sm`, `md`, `lg`

### Card

```tsx
<Card>
  <Card.Header>Pool Stats</Card.Header>
  <Card.Body>
    {/* content */}
  </Card.Body>
</Card>

<Card variant="outlined" hoverable onClick={handleClick}>
  {/* clickable card */}
</Card>
```

### Modal

```tsx
const [open, setOpen] = useState(false);

<Modal isOpen={open} onClose={() => setOpen(false)}>
  <Modal.Header>Select Token</Modal.Header>
  <Modal.Body>
    {/* content */}
  </Modal.Body>
  <Modal.Footer>
    <Button onClick={() => setOpen(false)}>Cancel</Button>
  </Modal.Footer>
</Modal>
```

### Input

```tsx
<Input
  value={amount}
  onChange={setAmount}
  placeholder="0.0"
  type="number"
  suffix="ETH"
  error={error}
/>
```

### TokenIcon

```tsx
<TokenIcon token={token} size={32} />
<TokenIcon token={token} size={24} showProtocol />
```

## Shared Components

Composed components used across pages. Import from `@/components/shared`.

```tsx
import { PageHeader, StatBox, DataTable, FilterBar } from '@/components/shared';
```

### PageHeader

```tsx
<PageHeader 
  title="Pools" 
  subtitle="Provide liquidity and earn fees"
  action={<Button>New Position</Button>}
/>
```

### StatBox

```tsx
<StatBox
  label="Total Value Locked"
  value="$124.5M"
  change={+5.2}
  icon={<LockIcon />}
/>
```

### DataTable

```tsx
<DataTable
  data={pools}
  columns={[
    { key: 'pair', label: 'Pool', render: (p) => `${p.token0}/${p.token1}` },
    { key: 'tvl', label: 'TVL', render: (p) => formatUsd(p.tvl), sortable: true },
    { key: 'apr', label: 'APR', render: (p) => `${p.apr}%`, sortable: true },
  ]}
  sortBy="tvl"
  sortDir="desc"
  onSort={handleSort}
  onRowClick={(pool) => navigate(`/pool/${pool.id}`)}
/>
```

### FilterBar

```tsx
<FilterBar
  search={search}
  onSearchChange={setSearch}
  filters={[
    { key: 'type', label: 'Type', options: ['All', 'Stable', 'Volatile'] },
    { key: 'status', label: 'Status', options: ['All', 'Active', 'Ended'] },
  ]}
  activeFilters={filters}
  onFilterChange={setFilters}
/>
```

## Swap Components

Swap page specific. Import from `@/components/swap`.

### TokenInput

```tsx
<TokenInput
  token={fromToken}
  amount={fromAmount}
  onAmountChange={setFromAmount}
  onTokenSelect={() => setShowSelector('from')}
  balance={balance}
  onMax={() => setFromAmount(balance)}
  label="From"
/>
```

### SwapDetails

```tsx
<SwapDetails
  quote={quote}
  fromToken={fromToken}
  toToken={toToken}
  slippage={slippage}
/>
```

### SwapRouteDisplay

```tsx
<SwapRouteDisplay
  route={quote.route}
  expanded={showRoute}
  onToggle={() => setShowRoute(!showRoute)}
/>
```

## Modals

Dialog components. Import from `@/components/modals`.

```tsx
import { 
  TokenSelectorModal,
  SlippageSettings,
  TransactionConfirmModal,
} from '@/components/modals';
```

### TokenSelectorModal

```tsx
<TokenSelectorModal
  isOpen={showSelector}
  onClose={() => setShowSelector(false)}
  onSelect={handleTokenSelect}
  selectedToken={fromToken}
  otherToken={toToken}  // excluded from list
/>
```

### TransactionConfirmModal

```tsx
<TransactionConfirmModal
  isOpen={showConfirm}
  onClose={() => setShowConfirm(false)}
  onConfirm={handleSwap}
  type="swap"
  fromToken={fromToken}
  toToken={toToken}
  fromAmount={fromAmount}
  toAmount={quote.expectedOut}
  priceImpact={quote.priceImpact}
  isLoading={isSwapping}
/>
```

## Layout

App shell components.

```tsx
import { Header, Footer } from '@/components/layout';

function App() {
  return (
    <>
      <Header />
      <main>{/* routes */}</main>
      <Footer />
    </>
  );
}
```

## Styling

Components use CSS modules (`.module.css`) for scoped styles. Global styles in `styles/`.

```tsx
// Component with CSS module
import styles from './Button.module.css';

<button className={styles.button} />
```

BEM naming in global CSS:
```css
.swap-card { }
.swap-card__header { }
.swap-card__header--expanded { }
```

## Adding Components

1. Create in appropriate directory
2. Add to directory's `index.ts` export
3. Use existing primitives from `ui/`
4. Add CSS module if needed
5. Add tests in `test/components.test.tsx`
