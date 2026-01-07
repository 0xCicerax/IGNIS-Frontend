import { test, expect } from '@playwright/test';

test.describe('App Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/app/swap');
  });

  test('should display the header with navigation', async ({ page }) => {
    // Header should be visible
    await expect(page.locator('header').first()).toBeVisible();
    
    // Navigation items should be present
    await expect(page.getByRole('button', { name: /swap/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /pools/i })).toBeVisible();
  });

  test('should navigate between pages', async ({ page }) => {
    // Go to Pools
    await page.getByRole('button', { name: /pools/i }).click();
    await expect(page).toHaveURL(/\/app\/pools/);
    
    // Go to Liquidity
    await page.getByRole('button', { name: /liquidity/i }).click();
    await expect(page).toHaveURL(/\/app\/liquidity/);
    
    // Go back to Swap
    await page.getByRole('button', { name: /swap/i }).click();
    await expect(page).toHaveURL(/\/app\/swap/);
  });

  test('should highlight active navigation item', async ({ page }) => {
    // Swap should be active initially
    const swapButton = page.getByRole('button', { name: /swap/i });
    await expect(swapButton).toHaveClass(/active/i);
    
    // Navigate to pools
    await page.getByRole('button', { name: /pools/i }).click();
    
    // Pools should now be active
    const poolsButton = page.getByRole('button', { name: /pools/i });
    await expect(poolsButton).toHaveClass(/active/i);
  });

  test('should show connect wallet button when not connected', async ({ page }) => {
    await expect(page.getByRole('button', { name: /connect/i })).toBeVisible();
  });

  test('should have skip link for accessibility', async ({ page }) => {
    // Tab to activate skip link
    await page.keyboard.press('Tab');
    
    // Skip link should become visible
    const skipLink = page.getByRole('link', { name: /skip to main/i });
    await expect(skipLink).toBeFocused();
  });

  test('mobile menu should work on small screens', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Look for mobile menu button
    const menuButton = page.getByRole('button', { name: /menu|open menu/i });
    
    if (await menuButton.isVisible()) {
      await menuButton.click();
      
      // Mobile navigation should be visible
      await expect(page.locator('#mobile-nav, [class*="mobile-menu"]')).toBeVisible();
    }
  });
});

test.describe('Keyboard Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/app/swap');
  });

  test('should open keyboard shortcuts with ? key', async ({ page }) => {
    // Press ? to open shortcuts
    await page.keyboard.press('Shift+/');
    
    // Modal should appear
    await expect(page.getByRole('dialog')).toBeVisible();
    await expect(page.getByText(/keyboard shortcuts/i)).toBeVisible();
    
    // Press Escape to close
    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog')).not.toBeVisible();
  });

  test('should navigate with G+S shortcut', async ({ page }) => {
    // First go to pools
    await page.goto('/app/pools');
    await expect(page).toHaveURL(/\/app\/pools/);
    
    // Use G then S to go to swap
    await page.keyboard.press('g');
    await page.keyboard.press('s');
    
    await expect(page).toHaveURL(/\/app\/swap/);
  });

  test('should navigate with G+P shortcut', async ({ page }) => {
    // Use G then P to go to pools
    await page.keyboard.press('g');
    await page.keyboard.press('p');
    
    await expect(page).toHaveURL(/\/app\/pools/);
  });
});
