export default async function globalSetup() {
  process.env.NODE_ENV = 'development';
  process.env.TURSO_DATABASE_URL =
    process.env.TURSO_DATABASE_URL || 'file:local.db';
  process.env.BETTER_AUTH_SECRET =
    process.env.BETTER_AUTH_SECRET || 'test_secret';
  process.env.TURSO_AUTH_TOKEN = 'mock-token';
}
