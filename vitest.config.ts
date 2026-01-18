import { defineVitestConfig } from '@nuxt/test-utils/config';

// Mock environment variables to satisfy app/utils/env.ts validation
process.env.TURSO_DATABASE_URL =
  process.env.TURSO_DATABASE_URL || 'libsql://mock-db-url';
process.env.TURSO_AUTH_TOKEN = process.env.TURSO_AUTH_TOKEN || 'mock-token';
process.env.BETTER_AUTH_SECRET =
  process.env.BETTER_AUTH_SECRET || 'mock-secret';
process.env.GOOGLE_CLIENT_ID = 'mock-google-id';
process.env.GOOGLE_CLIENT_SECRET = 'mock-google-secret';
process.env.GITHUB_CLIENT_ID = 'mock-github-id';
process.env.GITHUB_CLIENT_SECRET = 'mock-github-secret';

export default defineVitestConfig({
  test: {
    environment: 'happy-dom',
    exclude: ['tests/e2e/**', 'node_modules/**'],
  },
});
