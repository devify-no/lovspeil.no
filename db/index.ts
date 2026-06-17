import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const connectionString =
  process.env.DATABASE_URL ??
  "postgres://lovspeil:lovspeil@localhost:5432/lovspeil";

function createDb() {
  const client = postgres(connectionString, { max: 10, connect_timeout: 5 });
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
