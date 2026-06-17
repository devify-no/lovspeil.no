import "dotenv/config";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";
import { getDatabaseUrl, isNeonDatabase } from "./config";

function createPostgresClient(connectionString: string) {
  const isNeon = isNeonDatabase(connectionString);
  const isServerless = typeof process.env.NEXT_RUNTIME === "string";

  return postgres(connectionString, {
    // Neon pooler uses transaction mode – prepared statements must be off
    prepare: isNeon ? false : undefined,
    ssl: isNeon ? "require" : false,
    max: isNeon ? (isServerless ? 1 : 10) : 10,
    connect_timeout: 10,
    idle_timeout: isNeon ? 20 : undefined,
  });
}

function createDb() {
  const connectionString = getDatabaseUrl();
  const client = createPostgresClient(connectionString);
  return drizzle(client, { schema });
}

// Lazy singleton – avoids connection at import time during build
let _db: ReturnType<typeof createDb> | null = null;

export function getDb() {
  if (!_db) _db = createDb();
  return _db;
}

/** @deprecated Use getDb() – kept for convenience */
export const db = new Proxy({} as ReturnType<typeof createDb>, {
  get(_target, prop) {
    return Reflect.get(getDb(), prop);
  },
});

export { schema };
