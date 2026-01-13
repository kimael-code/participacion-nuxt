import { drizzle } from "drizzle-orm/libsql";
import { createClient } from "@libsql/client";

const isDevelopment = process.env.NODE_ENV === "development";

// En desarrollo, usar SQLite local; en producción, usar Turso
const client = createClient({
  url: isDevelopment
    ? "file:./server/database/local.db"
    : (process.env.TURSO_DATABASE_URL as string),
  authToken: isDevelopment ? undefined : process.env.TURSO_AUTH_TOKEN,
});

export const db = drizzle(client);
