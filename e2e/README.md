# E2E Tests

End-to-end tests for IGNIS using [Playwright](https://playwright.dev/).

## Setup

Install Playwright browsers (first time only):

```bash
npx playwright install
```

## Running Tests

### Run all tests
```bash
npm run test:e2e
```

### Run with UI mode (interactive)
```bash
npm run test:e2e:ui
```

### Run in headed mode (see browser)
```bash
npm run test:e2e:headed
```

### Debug mode
```bash
npm run test:e2e:debug
```

### View test report
```bash
npm run test:e2e:report
```

## Visual Regression Tests

Visual regression tests capture screenshots and compare them against baselines to detect unintended styling changes.

### Run visual tests only
```bash
npm run test:visual
```

### Update baseline screenshots
After intentional design changes, update the baseline images:
```bash
npm run test:visual:update
```

### How it works
1. **First run**: Creates baseline screenshots in `e2e/visual/*.spec.ts-snapshots/`
2. **Later runs**: Compares current screenshots to baselines
3. **If different**: Test fails, shows diff highlighting changes

### Visual test coverage
- **Pages**: Landing, Swap, Pools, Liquidity, Analytics, Stake, Portfolio, Depth
- **Responsive**: Desktop, Tablet (768px), Mobile (375px)
- **Components**: Modals, Swap card, Header, Pool rows, Stats cards
- **States**: Empty states, Loading skeletons, Mode toggles

## Test Structure

```
e2e/
├── landing.spec.ts      # Landing page tests
├── navigation.spec.ts   # App navigation & keyboard shortcuts
├── swap.spec.ts         # Swap page functionality
├── pools.spec.ts        # Pools listing & filtering
├── liquidity.spec.ts    # Liquidity positions
├── analytics.spec.ts    # Analytics page
├── stake.spec.ts        # Staking functionality
├── accessibility.spec.ts # A11y, responsiveness, performance
├── fixtures.ts          # Shared test utilities
└── visual/
    ├── pages.spec.ts    # Full page screenshots
    └── components.spec.ts # Component screenshots
```

## Test Coverage

### Landing Page
- Logo and branding display
- CTA button functionality
- Mobile responsiveness
- SEO meta tags

### Navigation
- Header navigation links
- Active tab highlighting
- Mobile menu
- Keyboard shortcuts (?, G+S, G+P, etc.)
- Skip link for accessibility

### Swap Page
- Token input fields
- Token selector modal
- Flip tokens functionality
- Mode toggle (Swap/TWAP/Limit)
- Settings modal
- Input validation
- Keyboard shortcuts (F, M, C)

### Pools Page
- Stats cards
- Search/filter functionality
- Pool list/table display
- Sorting
- Mobile layout

### Accessibility
- Document structure (h1, main landmark)
- Button accessible names
- Focus visibility
- Tab order
- Modal focus trap
- Responsive design

### Performance
- Page load time
- No console errors

## Configuration

See `playwright.config.ts` for:
- Browser configuration (Chromium, Firefox, WebKit)
- Mobile viewports (Pixel 5, iPhone 12)
- Dev server settings
- Retry and timeout settings

## CI Integration

Tests run automatically in CI. Set `CI=true` environment variable for:
- Single worker (sequential tests)
- Automatic retries
- No dev server reuse

```bash
CI=true npm run test:e2e
```

## Writing New Tests

```typescript
import { test, expect } from '@playwright/test';

test.describe('Feature Name', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/app/swap');
  });

  test('should do something', async ({ page }) => {
    await expect(page.getByRole('button', { name: /swap/i })).toBeVisible();
  });
});
```

## Utilities

Import helpers from `fixtures.ts`:

```typescript
import { waitForAppReady, fillTokenAmount, closeModal } from './fixtures';

test('example', async ({ page }) => {
  await page.goto('/app/swap');
  await waitForAppReady(page);
  await fillTokenAmount(page, '1.5');
});
```
