import { Page } from '@playwright/test';
import { seedTestCompany, upgradeUserToAdmin } from './db';

/**
 * Logs in a test user via API and upgrades them to admin.
 */
export async function loginAsAdmin(page: Page) {
  const email = `admin-${Date.now()}@test.com`;
  const password = 'password123';
  const name = 'Test Admin';

  // 1. Sign Up (creates user in DB)
  // We use page.request (APIRequestContext) which shares cookie storage with the page
  const _signUpRes = await page.request.post('/api/auth/sign-up/email', {
    data: {
      email,
      password,
      name,
    },
  });

  // Note: better-auth might return strict error if config disallows simple sign up?
  // But we have enabled it in development.
  // If signUpRes fails (e.g. email exists), we can try login?
  // But using unique email avoids collision.

  // 2. Prepare DB state
  const companyId = await seedTestCompany();
  await upgradeUserToAdmin(email, companyId);

  // 3. Sign In (just in case sign up didn't auto-login or we need to refresh claims)
  await page.request.post('/api/auth/sign-in/email', {
    data: {
      email,
      password,
    },
  });

  // No need to set cookies manually, the API response Set-Cookie header does it.
}

/**
 * Creates and logs in a new user WITHOUT assigning them to a company.
 * This is used to test the onboarding flow.
 */
export async function loginAsNewUser(page: Page) {
  const email = `newuser-${Date.now()}@test.com`;
  const password = 'password123';
  const name = 'New Test User';

  // 1. Sign Up
  await page.request.post('/api/auth/sign-up/email', {
    data: {
      email,
      password,
      name,
    },
  });

  // 2. Sign In (to establish session)
  await page.request.post('/api/auth/sign-in/email', {
    data: {
      email,
      password,
    },
  });

  // User is now logged in but has NO company assigned
  return { email, password, name };
}
