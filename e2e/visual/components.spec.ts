import { test, expect } from '@playwright/test';

/**
 * Visual Regression Tests - Components
 * 
 * Tests individual UI components in isolation to catch
 * styling regressions in reusable elements.
 */

test.describe('Visual Regression - Modals', () => {
  test.setTimeout(30000);

  test('Keyboard shortcuts modal', async ({ page }) => {
    await page.goto('/app/swap');
    await page.waitForLoadState('networkidle');
    
    // Open shortcuts modal
    await page.keyboard.press('Shift+/');
    await page.waitForTimeout(300);
    
    // Screenshot the modal
    const modal = page.getByRole('dialog');
    await expect(modal).toHaveScreenshot('keyboard-shortcuts-modal.png');
  });

  test('Token selector modal', async ({ page }) => {
    await page.goto('/app/swap');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
    
    // Open token selector
    const tokenButton = page.getByRole('button', { name: /ETH|USDC|select/i }).first();
    await tokenButton.click();
    await page.waitForTimeout(300);
    
    // Screenshot the modal
    const modal = page.getByRole('dialog');
    if (await modal.isVisible()) {
      await expect(modal).toHaveScreenshot('token-selector-modal.png');
    }
  });

  test('Settings modal', async ({ page }) => {
    await page.goto('/app/swap');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
    
    // Open settings
    const settingsButton = page.getByRole('button', { name: /settings|slippage/i });
    if (await settingsButton.isVisible()) {
      await settingsButton.click();
      await page.waitForTimeout(300);
      
      const modal = page.getByRole('dialog');
      if (await modal.isVisible()) {
        await expect(modal).toHaveScreenshot('settings-modal.png');
      }
    }
  });
});

test.describe('Visual Regression - Swap Components', () => {
  test.setTimeout(30000);

  test('Swap card - empty state', async ({ page }) => {
    await page.goto('/app/swap');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
    
    // Screenshot just the swap card
    const swapCard = page.locator('.swap-card, [class*="swap-card"]').first();
    if (await swapCard.isVisible()) {
      await expect(swapCard).toHaveScreenshot('swap-card-empty.png', {
        animations: 'disabled',
      });
    }
  });

  test('Swap card - with amount', async ({ page }) => {
    await page.goto('/app/swap');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
    
    // Enter an amount
    const input = page.locator('input[type="text"], input[inputmode="decimal"]').first();
    await input.fill('1.5');
    await page.waitForTimeout(500);
    
    // Screenshot the swap card with data
    const swapCard = page.locator('.swap-card, [class*="swap-card"]').first();
    if (await swapCard.isVisible()) {
      await expect(swapCard).toHaveScreenshot('swap-card-with-amount.png', {
        animations: 'disabled',
      });
    }
  });

  test('Mode toggle - TWAP selected', async ({ page }) => {
    await page.goto('/app/swap');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
    
    // Click TWAP mode
    const twapButton = page.getByRole('button', { name: /twap/i });
    if (await twapButton.isVisible()) {
      await twapButton.click();
      await page.waitForTimeout(300);
      
      // Screenshot the mode area with TWAP settings
      const swapCard = page.locator('.swap-card, [class*="swap-card"]').first();
      if (await swapCard.isVisible()) {
        await expect(swapCard).toHaveScreenshot('swap-card-twap-mode.png', {
          animations: 'disabled',
        });
      }
    }
  });

  test('Mode toggle - Limit selected', async ({ page }) => {
    await page.goto('/app/swap');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
    
    // Click Limit mode
    const limitButton = page.getByRole('button', { name: /limit/i });
    if (await limitButton.isVisible()) {
      await limitButton.click();
      await page.waitForTimeout(300);
      
      const swapCard = page.locator('.swap-card, [class*="swap-card"]').first();
      if (await swapCard.isVisible()) {
        await expect(swapCard).toHaveScreenshot('swap-card-limit-mode.png', {
          animations: 'disabled',
        });
      }
    }
  });
});

test.describe('Visual Regression - Header & Navigation', () => {
  test.setTimeout(30000);

  test('Header - desktop', async ({ page }) => {
    await page.goto('/app/swap');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);
    
    const header = page.locator('header').first();
    await expect(header).toHaveScreenshot('header-desktop.png', {
      animations: 'disabled',
    });
  });

  test('Header - mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/app/swap');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);
    
    const header = page.locator('header').first();
    await expect(header).toHaveScreenshot('header-mobile.png', {
      animations: 'disabled',
    });
  });

  test('Mobile menu open', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/app/swap');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);
    
    // Open mobile menu
    const menuButton = page.getByRole('button', { name: /menu|open menu/i });
    if (await menuButton.isVisible()) {
      await menuButton.click();
      await page.waitForTimeout(300);
      
      // Screenshot with menu open
      await expect(page).toHaveScreenshot('mobile-menu-open.png', {
        animations: 'disabled',
      });
    }
  });
});

test.describe('Visual Regression - Pool Components', () => {
  test.setTimeout(30000);

  test('Pool stats cards', async ({ page }) => {
    await page.goto('/app/pools');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1500);
    
    // Screenshot the stats grid
    const statsGrid = page.locator('.stats-grid, [class*="stats"]').first();
    if (await statsGrid.isVisible()) {
      await expect(statsGrid).toHaveScreenshot('pool-stats-grid.png', {
        animations: 'disabled',
      });
    }
  });

  test('Pool table row', async ({ page }) => {
    await page.goto('/app/pools');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1500);
    
    // Screenshot first pool row
    const poolRow = page.locator('tr[class*="row"], [class*="pool-row"]').first();
    if (await poolRow.isVisible()) {
      await expect(poolRow).toHaveScreenshot('pool-table-row.png', {
        animations: 'disabled',
      });
    }
  });

  test('Pool card - mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/app/pools');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1500);
    
    // Screenshot first pool card on mobile
    const poolCard = page.locator('[class*="pool-card"]').first();
    if (await poolCard.isVisible()) {
      await expect(poolCard).toHaveScreenshot('pool-card-mobile.png', {
        animations: 'disabled',
      });
    }
  });
});

test.describe('Visual Regression - Loading States', () => {
  test.setTimeout(30000);

  test('Pools page skeleton loading', async ({ page }) => {
    // Navigate without waiting for load
    await page.goto('/app/pools', { waitUntil: 'domcontentloaded' });
    
    // Quickly capture skeleton state
    await page.waitForTimeout(100);
    
    const skeleton = page.locator('[class*="skeleton"]').first();
    if (await skeleton.isVisible()) {
      await expect(page).toHaveScreenshot('pools-loading-skeleton.png', {
        animations: 'disabled',
      });
    }
  });
});

test.describe('Visual Regression - Empty States', () => {
  test.setTimeout(30000);

  test('Liquidity page - no positions', async ({ page }) => {
    await page.goto('/app/liquidity');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1500);
    
    // Capture empty state or connect prompt
    const emptyState = page.locator('[class*="empty"], text=/no.*position|connect/i').first();
    if (await emptyState.isVisible()) {
      await expect(emptyState).toHaveScreenshot('liquidity-empty-state.png', {
        animations: 'disabled',
      });
    }
  });
});
