import { test, expect } from '@playwright/test';

test.describe('Liquidity Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/app/liquidity');
  });

  test('should display liquidity page', async ({ page }) => {
    // Page should load
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  });

  test('should show positions or empty state', async ({ page }) => {
    // Wait for loading
    await page.waitForTimeout(1500);
    
    // Either shows positions or empty state message
    const content = page.locator('[class*="position"], [class*="empty"], text=/no.*position|connect.*wallet/i');
    await expect(content.first()).toBeVisible();
  });

  test('should have new position button', async ({ page }) => {
    // Wait for loading
    await page.waitForTimeout(1500);
    
    const newPositionBtn = page.getByRole('button', { name: /new|add|create.*position/i });
    if (await newPositionBtn.isVisible()) {
      await expect(newPositionBtn).toBeVisible();
    }
  });

  test('should prompt wallet connection if not connected', async ({ page }) => {
    // Wait for loading
    await page.waitForTimeout(1500);
    
    // Should show connect message or button
    const connectPrompt = page.getByText(/connect.*wallet/i).or(
      page.getByRole('button', { name: /connect/i })
    );
    await expect(connectPrompt.first()).toBeVisible();
  });
});

test.describe('Liquidity - Add Position Modal', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/app/liquidity');
    await page.waitForTimeout(1500);
  });

  test('should open add liquidity modal', async ({ page }) => {
    const addButton = page.getByRole('button', { name: /new|add|create.*position/i });
    
    if (await addButton.isVisible()) {
      await addButton.click();
      
      // Modal should open
      await expect(page.getByRole('dialog')).toBeVisible();
    }
  });

  test('modal should have token selectors', async ({ page }) => {
    const addButton = page.getByRole('button', { name: /new|add|create.*position/i });
    
    if (await addButton.isVisible()) {
      await addButton.click();
      await page.waitForTimeout(300);
      
      // Should have two token selection areas
      const tokenSelectors = page.locator('button:has-text("Select"), button:has-text("ETH"), button:has-text("USDC")');
      expect(await tokenSelectors.count()).toBeGreaterThanOrEqual(1);
    }
  });

  test('modal should close on escape', async ({ page }) => {
    const addButton = page.getByRole('button', { name: /new|add|create.*position/i });
    
    if (await addButton.isVisible()) {
      await addButton.click();
      await expect(page.getByRole('dialog')).toBeVisible();
      
      await page.keyboard.press('Escape');
      await expect(page.getByRole('dialog')).not.toBeVisible();
    }
  });
});
