# 09 · DB setup

Gate: `drizzle-kit generate` produces a migration; `drizzle-kit migrate` applies it to a local Postgres without errors.

- [ ] 1.1 Install `drizzle-orm`, `drizzle-kit`, `postgres` (node-postgres), `dotenv` in `packages/db`
- [ ] 1.2 Create `packages/db/drizzle.config.ts`:
  ```ts
  export default {
    schema: "./src/schema/**/*.ts",
    out: "./src/migrations",
    dialect: "postgresql",
    dbCredentials: { url: process.env.DATABASE_URL! },
  }
  ```
- [ ] 1.3 Create `packages/db/src/client.ts`: export `db` (Drizzle client) reading `DATABASE_URL` from env; export `sql` tag
- [ ] 1.4 Run `bunx @better-auth/cli generate` (or `npx`) with output path `packages/db/src/schema/auth.ts`; commit the generated schema file
- [ ] 1.5 Run `drizzle-kit generate`; commit migration files in `packages/db/src/migrations/`
- [ ] 1.6 Create `packages/db/src/index.ts`: re-export `db`, `sql`, and all schema tables
- [ ] 1.7 Verify: `pnpm --filter @ovr/db check-types` exits 0
