import { expect, test } from '@playwright/test';

test('has title', async ({ page }) => {
  await page.goto('/');

  // Expect a title "to contain" a substring.
  // We might need to adjust this depending on the actual title of the app
  // For now just checking if page loads and doesn't crash
  await expect(page).toHaveTitle(/Participación/i);
});
