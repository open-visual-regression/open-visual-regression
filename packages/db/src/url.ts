/// <reference types="node" />

/**
 * Builds a PostgreSQL connection URL from individual env vars.
 * Falls back to DATABASE_URL if set.
 */
export const buildDatabaseUrl = (env: NodeJS.ProcessEnv = process.env): string => {
  const {
    DATABASE_URL,
    DATABASE_USER = "postgres",
    DATABASE_PASSWORD = "postgres",
    DATABASE_HOST = "localhost",
    DATABASE_PORT = "5432",
    DATABASE_NAME = "open_visual_regression",
  } = env;

  if (DATABASE_URL) {
    return DATABASE_URL;
  }

  return `postgresql://${DATABASE_USER}:${DATABASE_PASSWORD}@${DATABASE_HOST}:${DATABASE_PORT}/${DATABASE_NAME}`;
};
