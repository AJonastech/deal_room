export function getDatabaseEnv() {
  const databaseUrl = process.env.DATABASE_URL;
  const directUrl = process.env.DIRECT_URL;
  if (!databaseUrl || !directUrl) {
    throw new Error("DATABASE_URL and DIRECT_URL are required");
  }

  return {
    databaseUrl,
    directUrl,
  };
}