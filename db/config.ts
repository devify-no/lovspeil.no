const LOCAL_DATABASE_URL =
  "postgres://lovspeil:lovspeil@localhost:5432/lovspeil";

export function getDatabaseUrl(): string {
  return process.env.DATABASE_URL ?? LOCAL_DATABASE_URL;
}

export function isNeonDatabase(url: string = getDatabaseUrl()): boolean {
  try {
    const hostname = new URL(url.replace(/^postgres:/, "postgresql:")).hostname;
    return hostname.endsWith(".neon.tech");
  } catch {
    return url.includes("neon.tech");
  }
}
