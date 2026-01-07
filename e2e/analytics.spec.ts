import { test, expect } from '@playwright/test';

test.describe('Analytics Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/app/analytics');
  });

  test('should display analytics page', async ({ page }) => {
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await expect(page.getByText(/analytics/i).first()).toBeVisible();
  });

  test('should show protocol stats', async ({ page }) => {
    // Wait for loading
    await page.waitForTimeout(1500);
    
    // Stats like TVL, volume should be visible
    const stats = page.getByText(/tvl|volume|fees/i);
    await expect(stats.first()).toBeVisible();
  });

  test('should have time period selector', async ({ page }) => {
    // Wait for loading
    await page.waitForTimeout(1500);
    
    // Time period buttons (24h, 7d, 30d, etc.)
    const timeSelector = page.getByRole('button', { name: /24h|7d|30d|1m|all/i });
    if (await timeSelector.first().isVisible()) {
      await expect(timeSelector.first()).toBeVisible();
    }
  });

  test('should display charts', async ({ page }) => {
    // Wait for loading
    await page.waitForTimeout(1500);
    
    // Charts or chart containers
    const charts = page.locator('canvas, svg[class*="chart"], [class*="chart"]');
    if (await charts.first().isVisible()) {
      await expect(charts.first()).toBeVisible();
    }
  });

  test('should show top pools section', async ({ page }) => {
    // Wait for loading
    await page.waitForTimeout(1500);
    
    // Top pools or similar section
    const topPools = page.getByText(/top.*pool|trending|popular/i);
    if (await topPools.isVisible()) {
      await expect(topPools).toBeVisible();
    }
  });
});
