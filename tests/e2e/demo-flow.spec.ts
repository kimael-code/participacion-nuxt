import { expect, test } from '@playwright/test';
import { loginAsNewUser } from './utils/auth';

test.describe('Demo Flow', () => {
  test.describe('New User Onboarding', () => {
    test('should redirect to onboarding if no company assigned', async ({
      page,
    }) => {
      // Capture console logs and errors
      page.on('console', (msg) => console.log('[Browser Console]', msg.text()));
      page.on('pageerror', (err) =>
        console.error('[Browser Error]', err.message),
      );

      // 1. Login as new user (no company)
      await loginAsNewUser(page);

      // 2. Try to access Dashboard (should redirect to onboarding)
      await page.goto('/dashboard');

      // 3. Expect Redirect to Onboarding
      await expect(page).toHaveURL('/onboarding');

      // Wait for Vue hydration to complete
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000); // Extra safety margin

      // 4. Click "Start Demo" and wait for navigation
      await Promise.all([
        page.waitForURL('/dashboard', { timeout: 15000 }),
        page.getByRole('button', { name: 'Iniciar Demo Ahora' }).click(),
      ]);

      // 5. Verify we're on dashboard
      await expect(page).toHaveURL('/dashboard');

      // 6. Verify we're on dashboard and it loaded
      // Check for dashboard heading or event selector
      await expect(
        page
          .getByText('Selecciona un evento')
          .or(page.getByText('Sin evento activo'))
          .first(),
      ).toBeVisible({
        timeout: 10000,
      });
    });
  });
});
