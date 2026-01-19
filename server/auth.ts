import { db } from './utils/db';

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: 'sqlite',
    schema: {
      user: schema.users,
      session: schema.sessions,
      account: schema.accounts,
      verification: schema.verifications,
    },
  }),
  plugins: [admin()],
  user: {
    additionalFields: {
      role: {
        type: 'string',
        defaultValue: 'user',
      },
    },
  },
  emailAndPassword: {
    enabled: true, // Siempre habilitado como fallback seguro
  },
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
      enabled: !!(
        process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
      ),
    },
    github: {
      clientId: process.env.GITHUB_CLIENT_ID || '',
      clientSecret: process.env.GITHUB_CLIENT_SECRET || '',
      enabled: !!(
        process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET
      ),
    },
  },
  secret: process.env.BETTER_AUTH_SECRET || 'development_secret_only_for_local',
  baseURL: process.env.BETTER_AUTH_URL || 'http://localhost:3000',
});

export type Session = typeof auth.$Infer.Session;
