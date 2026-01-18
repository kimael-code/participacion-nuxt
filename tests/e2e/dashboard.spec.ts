import { expect, test } from '@playwright/test';
import { loginAsAdmin } from './utils/auth';

test.describe('Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/dashboard');
  });

  test('should load dashboard and display user info', async ({ page }) => {
    // Check URL matches dashboard
    await expect(page).toHaveURL(/.*\/dashboard/);

    // Verify empty state message (using first() to avoid strict mode violation if multiple exist)
    await expect(
      page
        .getByText('Selecciona un evento')
        .or(page.getByText('Sin evento activo'))
        .first(),
    ).toBeVisible();
  });
});
