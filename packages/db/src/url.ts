/// <reference types="node" />

/**
 * Builds a PostgreSQL connection URL from individual env vars.
 * Falls back to DATABASE_URL if set.
 *
 * Env vars (in priority order):
 *   DATABASE_URL            — full URL, takes precedence
 *   DATABASE_USER           — postgres user
 *   DATABASE_PASSWORD       — postgres password
 *   DATABASE_HOST           — host (default: localhost)
 *   DATABASE_PORT           — port (default: 5432)
 *   DATABASE_NAME           — database name
 */
export const buildDatabaseUrl = (env: NodeJS.ProcessEnv = process.env): string => {
  const {
    DATABASE_URL,
    DATABASE_USER,
    DATABASE_PASSWORD,
    DATABASE_HOST = "localhost",
    DATABASE_PORT = "5432",
    DATABASE_NAME,
  } = env;

  if (DATABASE_URL) {
    return DATABASE_URL;
  }

  if (!DATABASE_USER || !DATABASE_PASSWORD || !DATABASE_NAME) {
    return "";
  }

  return `postgresql://${DATABASE_USER}:${DATABASE_PASSWORD}@${DATABASE_HOST}:${DATABASE_PORT}/${DATABASE_NAME}`;
};
