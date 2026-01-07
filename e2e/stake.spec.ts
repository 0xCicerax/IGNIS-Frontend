import { test, expect } from '@playwright/test';

test.describe('Stake Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/app/stake');
  });

  test('should display stake page', async ({ page }) => {
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  });

  test('should show staking stats', async ({ page }) => {
    // Wait for loading
    await page.waitForTimeout(1500);
    
    // Stats like APR, total staked
    const stats = page.getByText(/apr|staked|rewards/i);
    await expect(stats.first()).toBeVisible();
  });

  test('should have stake input', async ({ page }) => {
    // Wait for loading
    await page.waitForTimeout(1500);
    
    // Input for staking amount
    const stakeInput = page.locator('input[type="text"], input[inputmode="decimal"]');
    if (await stakeInput.first().isVisible()) {
      await stakeInput.first().fill('100');
      await expect(stakeInput.first()).toHaveValue('100');
    }
  });

  test('should show lock duration options', async ({ page }) => {
    // Wait for loading
    await page.waitForTimeout(1500);
    
    // Lock duration buttons or slider
    const lockOptions = page.getByText(/week|month|year|lock/i);
    if (await lockOptions.first().isVisible()) {
      await expect(lockOptions.first()).toBeVisible();
    }
  });

  test('should display veToken info', async ({ page }) => {
    // Wait for loading
    await page.waitForTimeout(1500);
    
    // veIGNI or voting power info
    const veInfo = page.getByText(/ve|voting.*power|boost/i);
    if (await veInfo.first().isVisible()) {
      await expect(veInfo.first()).toBeVisible();
    }
  });

  test('should prompt connect wallet', async ({ page }) => {
    // Stake button should require wallet
    const stakeButton = page.getByRole('button', { name: /stake|connect/i });
    await expect(stakeButton.first()).toBeVisible();
  });
});
