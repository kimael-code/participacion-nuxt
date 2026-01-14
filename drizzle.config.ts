import { defineConfig } from 'drizzle-kit';
import env from './app/utils/env';

export default defineConfig({
  schema: './server/database/schema.ts',
  out: './server/database/migrations',
  dialect: env.TURSO_DATABASE_URL.startsWith('file:') ? 'sqlite' : 'turso',
  dbCredentials: {
    url: env.TURSO_DATABASE_URL,
    authToken: env.TURSO_AUTH_TOKEN,
  },
});
