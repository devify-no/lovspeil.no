import "dotenv/config";
import { drizzle as drizzleNeon } from "drizzle-orm/neon-http";
import { drizzle as drizzlePostgres } from "drizzle-orm/postgres-js";
import { neon } from "@neondatabase/serverless";
import postgres from "postgres";
import * as schema from "./schema";
import { getDatabaseUrl, isNeonDatabase } from "./config";

function createDb() {
  const connectionString = getDatabaseUrl();

  if (isNeonDatabase(connectionString)) {
    const sql = neon(connectionString);
    return drizzleNeon({ client: sql, schema });
  }

  const client = postgres(connectionString, { max: 10, connect_timeout: 5 });
  return drizzlePostgres(client, { schema });
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
