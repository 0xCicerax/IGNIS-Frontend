import { test, expect } from '@playwright/test';

/**
 * Visual Regression Tests - Pages
 * 
 * These tests capture screenshots of each page and compare them
 * against baseline images to detect unintended visual changes.
 * 
 * First run: Creates baseline screenshots in e2e/visual.spec.ts-snapshots/
 * Later runs: Compares current screenshots to baselines
 * 
 * To update baselines after intentional changes:
 *   npx playwright test --update-snapshots
 */

test.describe('Visual Regression - Pages', () => {
  // Increase timeout for screenshot comparisons
  test.setTimeout(30000);

  test('Landing page', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500); // Wait for animations
    
    await expect(page).toHaveScreenshot('landing-page.png', {
      fullPage: true,
      animations: 'disabled',
    });
  });

  test('Swap page', async ({ page }) => {
    await page.goto('/app/swap');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000); // Wait for loading states
    
    await expect(page).toHaveScreenshot('swap-page.png', {
      animations: 'disabled',
    });
  });

  test('Pools page', async ({ page }) => {
    await page.goto('/app/pools');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1500); // Wait for data to load
    
    await expect(page).toHaveScreenshot('pools-page.png', {
      animations: 'disabled',
    });
  });

  test('Liquidity page', async ({ page }) => {
    await page.goto('/app/liquidity');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1500);
    
    await expect(page).toHaveScreenshot('liquidity-page.png', {
      animations: 'disabled',
    });
  });

  test('Analytics page', async ({ page }) => {
    await page.goto('/app/analytics');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1500);
    
    await expect(page).toHaveScreenshot('analytics-page.png', {
      animations: 'disabled',
    });
  });

  test('Stake page', async ({ page }) => {
    await page.goto('/app/stake');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1500);
    
    await expect(page).toHaveScreenshot('stake-page.png', {
      animations: 'disabled',
    });
  });

  test('Portfolio page', async ({ page }) => {
    await page.goto('/app/portfolio');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1500);
    
    await expect(page).toHaveScreenshot('portfolio-page.png', {
      animations: 'disabled',
    });
  });

  test('Market Depth page', async ({ page }) => {
    await page.goto('/app/depth');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1500);
    
    await expect(page).toHaveScreenshot('depth-page.png', {
      animations: 'disabled',
    });
  });
});

test.describe('Visual Regression - Mobile Pages', () => {
  test.setTimeout(30000);

  test.use({ viewport: { width: 375, height: 667 } });

  test('Landing page - mobile', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);
    
    await expect(page).toHaveScreenshot('landing-page-mobile.png', {
      fullPage: true,
      animations: 'disabled',
    });
  });

  test('Swap page - mobile', async ({ page }) => {
    await page.goto('/app/swap');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
    
    await expect(page).toHaveScreenshot('swap-page-mobile.png', {
      animations: 'disabled',
    });
  });

  test('Pools page - mobile', async ({ page }) => {
    await page.goto('/app/pools');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1500);
    
    await expect(page).toHaveScreenshot('pools-page-mobile.png', {
      animations: 'disabled',
    });
  });
});

test.describe('Visual Regression - Tablet', () => {
  test.setTimeout(30000);

  test.use({ viewport: { width: 768, height: 1024 } });

  test('Swap page - tablet', async ({ page }) => {
    await page.goto('/app/swap');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
    
    await expect(page).toHaveScreenshot('swap-page-tablet.png', {
      animations: 'disabled',
    });
  });

  test('Pools page - tablet', async ({ page }) => {
    await page.goto('/app/pools');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1500);
    
    await expect(page).toHaveScreenshot('pools-page-tablet.png', {
      animations: 'disabled',
    });
  });
});
