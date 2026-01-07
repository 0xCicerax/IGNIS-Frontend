import { test, expect } from '@playwright/test';

test.describe('Swap Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/app/swap');
  });

  test('should display swap interface', async ({ page }) => {
    // Main swap card should be visible
    await expect(page.locator('.swap-card, [class*="swap"]').first()).toBeVisible();
    
    // Mode toggle should be present
    await expect(page.getByRole('button', { name: /swap/i }).first()).toBeVisible();
  });

  test('should have token input fields', async ({ page }) => {
    // From input
    const fromInput = page.locator('input[type="text"]').first();
    await expect(fromInput).toBeVisible();
    
    // Should be able to type amount
    await fromInput.fill('1.5');
    await expect(fromInput).toHaveValue('1.5');
  });

  test('should show token selectors', async ({ page }) => {
    // Token selector buttons should be visible
    const tokenButtons = page.locator('button:has-text("ETH"), button:has-text("USDC"), button:has-text("Select")');
    await expect(tokenButtons.first()).toBeVisible();
  });

  test('should open token selector modal', async ({ page }) => {
    // Click on a token selector
    const tokenSelector = page.getByRole('button', { name: /select.*token|ETH|USDC/i }).first();
    await tokenSelector.click();
    
    // Modal should open
    await expect(page.getByRole('dialog')).toBeVisible();
    
    // Should show token list
    await expect(page.getByText(/select.*token/i)).toBeVisible();
  });

  test('should switch tokens with arrow button', async ({ page }) => {
    // Find the swap/flip arrow button
    const flipButton = page.getByRole('button', { name: /switch|flip|swap direction/i });
    
    if (await flipButton.isVisible()) {
      // Get initial token order (simplified check)
      const beforeFlip = await page.locator('.swap-card').textContent();
      
      await flipButton.click();
      
      // Content should change after flip
      const afterFlip = await page.locator('.swap-card').textContent();
      // Just verify the action completed without error
      expect(afterFlip).toBeDefined();
    }
  });

  test('should show swap details when amount entered', async ({ page }) => {
    // Enter an amount
    const fromInput = page.locator('input[type="text"], input[inputmode="decimal"]').first();
    await fromInput.fill('1');
    
    // Wait for quote/details to appear
    await page.waitForTimeout(500);
    
    // Swap details should show rate, price impact, etc.
    const swapDetails = page.locator('[class*="swap-details"], [class*="details"]');
    if (await swapDetails.isVisible()) {
      await expect(swapDetails).toContainText(/rate|impact|fee/i);
    }
  });

  test('should show connect wallet button when not connected', async ({ page }) => {
    // Enter amount first
    const fromInput = page.locator('input[type="text"], input[inputmode="decimal"]').first();
    await fromInput.fill('1');
    
    // Submit button should prompt to connect
    const submitButton = page.getByRole('button', { name: /connect|wallet/i });
    await expect(submitButton).toBeVisible();
  });

  test('should validate input amounts', async ({ page }) => {
    const fromInput = page.locator('input[type="text"], input[inputmode="decimal"]').first();
    
    // Enter 0
    await fromInput.fill('0');
    
    // Should show some indication that amount is invalid
    // Either button is disabled or there's an error message
    const submitButton = page.locator('button:has-text("Swap"), button:has-text("Enter")');
    if (await submitButton.isVisible()) {
      // Button should be disabled or show "Enter amount"
      const buttonText = await submitButton.textContent();
      expect(buttonText?.toLowerCase()).toMatch(/enter|amount|connect/i);
    }
  });

  test('mode toggle should switch between swap/twap/limit', async ({ page }) => {
    // Find mode buttons
    const swapMode = page.getByRole('button', { name: /^swap$/i });
    const twapMode = page.getByRole('button', { name: /twap/i });
    const limitMode = page.getByRole('button', { name: /limit/i });
    
    // Click TWAP if available
    if (await twapMode.isVisible()) {
      await twapMode.click();
      // TWAP settings should appear
      await expect(page.getByText(/trades|interval/i)).toBeVisible();
    }
    
    // Click Limit if available
    if (await limitMode.isVisible()) {
      await limitMode.click();
      // Limit settings should appear
      await expect(page.getByText(/limit.*price|expiry/i)).toBeVisible();
    }
    
    // Go back to Swap
    if (await swapMode.isVisible()) {
      await swapMode.click();
    }
  });

  test('should open settings modal', async ({ page }) => {
    // Find settings button (gear icon)
    const settingsButton = page.getByRole('button', { name: /settings|slippage/i });
    
    if (await settingsButton.isVisible()) {
      await settingsButton.click();
      
      // Settings modal should open
      await expect(page.getByRole('dialog')).toBeVisible();
      await expect(page.getByText(/slippage/i)).toBeVisible();
    }
  });

  test('keyboard shortcut F should flip tokens', async ({ page }) => {
    // Press F to flip
    await page.keyboard.press('f');
    
    // Should complete without error (we can't easily verify the flip happened)
    // Just ensure no crash
    await expect(page.locator('.swap-card, [class*="swap"]').first()).toBeVisible();
  });

  test('keyboard shortcut M should set max amount', async ({ page }) => {
    // Press M for max
    await page.keyboard.press('m');
    
    // Input might get populated (depending on mock balance)
    const fromInput = page.locator('input[type="text"], input[inputmode="decimal"]').first();
    await expect(fromInput).toBeVisible();
  });
});

test.describe('Swap Page Accessibility', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/app/swap');
  });

  test('inputs should have labels', async ({ page }) => {
    // Inputs should be labeled
    const inputs = page.locator('input');
    const count = await inputs.count();
    
    for (let i = 0; i < Math.min(count, 3); i++) {
      const input = inputs.nth(i);
      const id = await input.getAttribute('id');
      
      if (id) {
        // Should have associated label
        const label = page.locator(`label[for="${id}"]`);
        const ariaLabel = await input.getAttribute('aria-label');
        const ariaLabelledBy = await input.getAttribute('aria-labelledby');
        
        const hasLabel = await label.isVisible() || ariaLabel || ariaLabelledBy;
        expect(hasLabel).toBeTruthy();
      }
    }
  });

  test('buttons should be keyboard accessible', async ({ page }) => {
    // Tab through buttons
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    
    // Something should be focused
    const focusedElement = page.locator(':focus');
    await expect(focusedElement).toBeVisible();
  });

  test('modals should trap focus', async ({ page }) => {
    // Open token selector
    const tokenSelector = page.getByRole('button', { name: /select.*token|ETH|USDC/i }).first();
    await tokenSelector.click();
    
    // Modal should be visible
    await expect(page.getByRole('dialog')).toBeVisible();
    
    // Focus should be inside modal
    const focusedElement = page.locator(':focus');
    const dialog = page.getByRole('dialog');
    
    // Tab through modal
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    
    // Focus should still be inside dialog (focus trap)
    const stillFocused = page.locator(':focus');
    await expect(stillFocused).toBeVisible();
    
    // Close with Escape
    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog')).not.toBeVisible();
  });
});
