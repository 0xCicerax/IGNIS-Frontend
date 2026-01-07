import { test as base, expect } from '@playwright/test';

/**
 * Custom test fixtures for IGNIS E2E tests
 */

// Extended test with custom fixtures
export const test = base.extend<{
  // Add custom fixtures here as needed
}>({
  // Example: auto-wait for app to be ready
});

/**
 * Helper to wait for page to be fully loaded
 */
export async function waitForAppReady(page: import('@playwright/test').Page) {
  // Wait for loading states to complete
  await page.waitForTimeout(1500);
  
  // Wait for any skeletons to disappear
  const skeletons = page.locator('[class*="skeleton"], [class*="loading"]');
  if (await skeletons.count() > 0) {
    await skeletons.first().waitFor({ state: 'hidden', timeout: 5000 }).catch(() => {});
  }
}

/**
 * Helper to connect a mock wallet (for testing connected states)
 * Note: This requires the app to support a mock/demo mode
 */
export async function connectMockWallet(page: import('@playwright/test').Page) {
  // The app has mock wallet functionality
  // This would click connect and select mock option if available
  const connectButton = page.getByRole('button', { name: /connect/i });
  if (await connectButton.isVisible()) {
    await connectButton.click();
    // Wait for modal/options
    await page.waitForTimeout(500);
  }
}

/**
 * Helper to navigate to a specific app page
 */
export async function navigateToPage(
  page: import('@playwright/test').Page, 
  pageName: 'swap' | 'pools' | 'liquidity' | 'stake' | 'analytics' | 'portfolio' | 'depth'
) {
  await page.goto(`/app/${pageName}`);
  await waitForAppReady(page);
}

/**
 * Helper to open keyboard shortcuts modal
 */
export async function openShortcutsModal(page: import('@playwright/test').Page) {
  await page.keyboard.press('Shift+/');
  await expect(page.getByRole('dialog')).toBeVisible();
}

/**
 * Helper to close any open modal
 */
export async function closeModal(page: import('@playwright/test').Page) {
  const dialog = page.getByRole('dialog');
  if (await dialog.isVisible()) {
    await page.keyboard.press('Escape');
    await expect(dialog).not.toBeVisible();
  }
}

/**
 * Helper to fill token amount input
 */
export async function fillTokenAmount(
  page: import('@playwright/test').Page, 
  amount: string,
  inputIndex = 0
) {
  const inputs = page.locator('input[type="text"], input[inputmode="decimal"]');
  const input = inputs.nth(inputIndex);
  await input.fill(amount);
  return input;
}

/**
 * Helper to check if element is in viewport
 */
export async function isInViewport(page: import('@playwright/test').Page, selector: string) {
  return page.evaluate((sel) => {
    const element = document.querySelector(sel);
    if (!element) return false;
    
    const rect = element.getBoundingClientRect();
    return (
      rect.top >= 0 &&
      rect.left >= 0 &&
      rect.bottom <= window.innerHeight &&
      rect.right <= window.innerWidth
    );
  }, selector);
}

/**
 * Test data constants
 */
export const TEST_TOKENS = {
  ETH: 'ETH',
  USDC: 'USDC',
  WETH: 'WETH',
  DAI: 'DAI',
};

export const TEST_AMOUNTS = {
  SMALL: '0.01',
  MEDIUM: '1',
  LARGE: '100',
};

// Re-export expect for convenience
export { expect };
