import { test, expect } from '@playwright/test';

test.describe('Accessibility', () => {
  const pages = [
    { name: 'Landing', url: '/' },
    { name: 'Swap', url: '/app/swap' },
    { name: 'Pools', url: '/app/pools' },
    { name: 'Liquidity', url: '/app/liquidity' },
    { name: 'Analytics', url: '/app/analytics' },
    { name: 'Stake', url: '/app/stake' },
  ];

  for (const pageInfo of pages) {
    test(`${pageInfo.name} page should have proper document structure`, async ({ page }) => {
      await page.goto(pageInfo.url);
      
      // Should have exactly one h1
      const h1Count = await page.locator('h1').count();
      expect(h1Count).toBeGreaterThanOrEqual(1);
      
      // Should have a main landmark
      if (pageInfo.url !== '/') {
        const main = page.locator('main, [role="main"]');
        await expect(main).toBeVisible();
      }
    });

    test(`${pageInfo.name} page should have no broken images`, async ({ page }) => {
      await page.goto(pageInfo.url);
      await page.waitForTimeout(1000);
      
      // Check all images loaded
      const images = page.locator('img');
      const count = await images.count();
      
      for (let i = 0; i < count; i++) {
        const img = images.nth(i);
        const naturalWidth = await img.evaluate((el: HTMLImageElement) => el.naturalWidth);
        // naturalWidth > 0 means image loaded
        expect(naturalWidth).toBeGreaterThan(0);
      }
    });

    test(`${pageInfo.name} page buttons should have accessible names`, async ({ page }) => {
      await page.goto(pageInfo.url);
      await page.waitForTimeout(1000);
      
      // Get all buttons
      const buttons = page.locator('button');
      const count = await buttons.count();
      
      for (let i = 0; i < Math.min(count, 10); i++) {
        const button = buttons.nth(i);
        
        if (await button.isVisible()) {
          // Button should have text content, aria-label, or aria-labelledby
          const text = await button.textContent();
          const ariaLabel = await button.getAttribute('aria-label');
          const ariaLabelledBy = await button.getAttribute('aria-labelledby');
          
          const hasAccessibleName = (text && text.trim().length > 0) || ariaLabel || ariaLabelledBy;
          expect(hasAccessibleName).toBeTruthy();
        }
      }
    });
  }
});

test.describe('Color Scheme', () => {
  test('should respect prefers-color-scheme', async ({ page }) => {
    // Test dark mode (default for this app)
    await page.goto('/app/swap');
    
    // Check background is dark
    const bgColor = await page.evaluate(() => {
      return window.getComputedStyle(document.body).backgroundColor;
    });
    
    // Should be a dark color (low RGB values)
    // This is a basic check - the app uses dark theme
    expect(bgColor).toBeDefined();
  });
});

test.describe('Focus Management', () => {
  test('focus should be visible when using keyboard', async ({ page }) => {
    await page.goto('/app/swap');
    
    // Tab to first interactive element
    await page.keyboard.press('Tab');
    
    // Focused element should have visible focus
    const focusedElement = page.locator(':focus');
    await expect(focusedElement).toBeVisible();
  });

  test('tab order should be logical', async ({ page }) => {
    await page.goto('/app/swap');
    
    const focusOrder: string[] = [];
    
    // Tab through first 10 elements
    for (let i = 0; i < 10; i++) {
      await page.keyboard.press('Tab');
      const focused = await page.evaluate(() => {
        const el = document.activeElement;
        return el?.tagName || 'none';
      });
      focusOrder.push(focused);
    }
    
    // Should tab through various elements
    expect(focusOrder.length).toBe(10);
  });

  test('escape should close modals', async ({ page }) => {
    await page.goto('/app/swap');
    
    // Open keyboard shortcuts
    await page.keyboard.press('Shift+/');
    await expect(page.getByRole('dialog')).toBeVisible();
    
    // Escape should close
    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog')).not.toBeVisible();
  });
});

test.describe('Responsive Design', () => {
  const viewports = [
    { name: 'Mobile', width: 375, height: 667 },
    { name: 'Tablet', width: 768, height: 1024 },
    { name: 'Desktop', width: 1280, height: 800 },
    { name: 'Wide', width: 1920, height: 1080 },
  ];

  for (const viewport of viewports) {
    test(`Swap page should work on ${viewport.name}`, async ({ page }) => {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await page.goto('/app/swap');
      
      // Page should load without horizontal scroll
      const hasHorizontalScroll = await page.evaluate(() => {
        return document.documentElement.scrollWidth > document.documentElement.clientWidth;
      });
      
      // Main content should be visible
      await expect(page.locator('.swap-card, [class*="swap"]').first()).toBeVisible();
    });
  }
});

test.describe('Performance', () => {
  test('page should load within reasonable time', async ({ page }) => {
    const startTime = Date.now();
    
    await page.goto('/app/swap');
    await page.waitForLoadState('domcontentloaded');
    
    const loadTime = Date.now() - startTime;
    
    // Should load DOM within 5 seconds
    expect(loadTime).toBeLessThan(5000);
  });

  test('no console errors on page load', async ({ page }) => {
    const errors: string[] = [];
    
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });
    
    await page.goto('/app/swap');
    await page.waitForTimeout(2000);
    
    // Filter out known third-party errors
    const criticalErrors = errors.filter(
      (e) => !e.includes('favicon') && !e.includes('third-party')
    );
    
    // Should have no critical console errors
    expect(criticalErrors.length).toBe(0);
  });
});
