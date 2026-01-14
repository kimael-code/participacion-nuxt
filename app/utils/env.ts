import z from 'zod';
import tryParseEnv from './try-parse-env';

const EnvSchema = z.object({
  NODE_ENV: z.string().default('development'),
  TURSO_DATABASE_URL: z.string(),
  TURSO_AUTH_TOKEN: z.string().optional(),
});

export type EnvSchema = z.infer<typeof EnvSchema>;

tryParseEnv(EnvSchema);

// eslint-disable-next-line node/no-process-env
export default EnvSchema.parse(process.env);
