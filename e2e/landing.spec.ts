import { test, expect } from '@playwright/test';

test.describe('Landing Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should display the IGNIS logo and branding', async ({ page }) => {
    // Check for logo/branding
    await expect(page.locator('text=IGNIS')).toBeVisible();
  });

  test('should have a call-to-action button', async ({ page }) => {
    // Look for launch app or get started button
    const ctaButton = page.getByRole('button', { name: /launch|start|enter|app/i })
      .or(page.getByRole('link', { name: /launch|start|enter|app/i }));
    
    await expect(ctaButton.first()).toBeVisible();
  });

  test('should navigate to app when CTA is clicked', async ({ page }) => {
    // Find and click the CTA
    const ctaButton = page.getByRole('button', { name: /launch|start|enter|app/i })
      .or(page.getByRole('link', { name: /launch|start|enter|app/i }));
    
    await ctaButton.first().click();
    
    // Should navigate to /app/swap
    await expect(page).toHaveURL(/\/app/);
  });

  test('should be responsive on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Page should still be functional
    await expect(page.locator('text=IGNIS')).toBeVisible();
  });

  test('should have proper meta tags for SEO', async ({ page }) => {
    // Check title
    await expect(page).toHaveTitle(/IGNIS/i);
    
    // Check meta description
    const metaDescription = page.locator('meta[name="description"]');
    await expect(metaDescription).toHaveAttribute('content', /.+/);
  });
});
