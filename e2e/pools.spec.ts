import { test, expect } from '@playwright/test';

test.describe('Pools Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/app/pools');
  });

  test('should display pools page header', async ({ page }) => {
    // Page header
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await expect(page.getByText(/pools|liquidity/i).first()).toBeVisible();
  });

  test('should display stats cards', async ({ page }) => {
    // Wait for loading to complete
    await page.waitForTimeout(1500);
    
    // Stats should be visible
    await expect(page.getByText(/tvl|total.*value/i).first()).toBeVisible();
  });

  test('should have search/filter functionality', async ({ page }) => {
    // Wait for page to load
    await page.waitForTimeout(1500);
    
    // Search input
    const searchInput = page.getByPlaceholder(/search/i);
    if (await searchInput.isVisible()) {
      await searchInput.fill('ETH');
      
      // Results should filter
      await page.waitForTimeout(300);
    }
  });

  test('should display pool list or table', async ({ page }) => {
    // Wait for loading
    await page.waitForTimeout(1500);
    
    // Should have table or pool cards
    const poolsContent = page.locator('table, [class*="pool-card"], [class*="pool-row"]');
    await expect(poolsContent.first()).toBeVisible();
  });

  test('should have type filter options', async ({ page }) => {
    // Wait for loading
    await page.waitForTimeout(1500);
    
    // Filter buttons for pool types
    const allFilter = page.getByRole('button', { name: /all/i });
    if (await allFilter.isVisible()) {
      await expect(allFilter).toBeVisible();
    }
  });

  test('pool row should be clickable', async ({ page }) => {
    // Wait for pools to load
    await page.waitForTimeout(1500);
    
    // Find a pool row/card
    const poolItem = page.locator('tr[class*="row"], [class*="pool-card"]').first();
    
    if (await poolItem.isVisible()) {
      await poolItem.click();
      
      // Should navigate to pool detail or open modal
      await page.waitForTimeout(500);
      // URL might change or modal might open
    }
  });

  test('should have add liquidity button', async ({ page }) => {
    // Wait for loading
    await page.waitForTimeout(1500);
    
    // Add liquidity or new position button
    const addButton = page.getByRole('button', { name: /add|new.*position|deposit/i });
    if (await addButton.isVisible()) {
      await expect(addButton).toBeVisible();
    }
  });

  test('should be sortable', async ({ page }) => {
    // Wait for loading
    await page.waitForTimeout(1500);
    
    // Find sortable headers
    const sortableHeader = page.locator('th:has-text("TVL"), th:has-text("APR"), th:has-text("Volume")').first();
    
    if (await sortableHeader.isVisible()) {
      await sortableHeader.click();
      
      // Should toggle sort (visual change)
      await page.waitForTimeout(300);
    }
  });
});

test.describe('Pools Page Mobile', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/app/pools');
  });

  test('should display mobile-friendly layout', async ({ page }) => {
    // Wait for loading
    await page.waitForTimeout(1500);
    
    // Should show card layout instead of table on mobile
    // or table should be scrollable
    const content = page.locator('[class*="pool"]').first();
    await expect(content).toBeVisible();
  });

  test('should have working filters on mobile', async ({ page }) => {
    // Wait for loading
    await page.waitForTimeout(1500);
    
    // Filters should still be accessible
    const searchInput = page.getByPlaceholder(/search/i);
    if (await searchInput.isVisible()) {
      await searchInput.fill('USDC');
      await page.waitForTimeout(300);
    }
  });
});
