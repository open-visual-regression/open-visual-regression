# 09 · DB setup

Gate: `drizzle-kit generate` produces a migration; `drizzle-kit migrate` applies it to a local Postgres without errors.

- [x] 1.1 Install `drizzle-orm`, `drizzle-kit`, `postgres` (node-postgres), `dotenv` in `packages/db`
- [x] 1.2 Create `packages/db/drizzle.config.ts`:
  ```ts
  export default {
    schema: "./src/schema/**/*.ts",
    out: "./src/migrations",
    dialect: "postgresql",
    dbCredentials: { url: process.env.DATABASE_URL! },
  }
  ```
- [x] 1.3 Create `packages/db/src/client.ts`: export `db` (Drizzle client) reading `DATABASE_URL` from env; export `sql` tag
- [x] 1.4 Create `packages/db/src/index.ts`: re-export `db` and `sql` (schema table re-exports added in change 10 once auth schema exists)
- [x] 1.5 Verify: `pnpm --filter @ovr/db check-types` exits 0
