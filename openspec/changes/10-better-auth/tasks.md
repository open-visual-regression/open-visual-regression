# 10 · Better Auth config

Gate: `GET /api/auth/session` returns 200 with null session for unauthenticated request; Better Auth tables exist in DB after migration.

- [ ] 1.1 Install `better-auth` in `apps/web`
- [ ] 1.2 Create `apps/web/lib/auth.ts`:
  - Import `db` from `@ovr/db/client`
  - Plugins: `admin()`, `apiKey({ prefix: "ovr_pk_live_" })`, `organization()`, `rateLimit()`
  - `sendInvitationEmail`: no-op (OVR does not send email; URL is surfaced in admin UI)
  - `trustedOrigins: [process.env.BASE_URL ?? "http://localhost:3000"]`
  - Export `auth` and inferred `Session` + `User` types
- [ ] 1.3 Run `npx @better-auth/cli generate --config apps/web/lib/auth.ts --output packages/db/src/schema/auth.ts`; commit the generated schema file
- [ ] 1.4 Run `drizzle-kit generate` from `packages/db`; commit migration files in `packages/db/src/migrations/`
- [ ] 1.5 Verify `pnpm --filter @ovr/db check-types` exits 0 with the generated schema in place
- [ ] 1.6 Create `apps/web/lib/auth-client.ts`:
  - Better Auth client with `baseURL: process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000"`
  - Export `authClient` with matching plugin inference
- [ ] 1.7 Create `apps/web/app/api/auth/[...all]/route.ts`: mount Better Auth handler
  ```ts
  import { auth } from "@/lib/auth"
  export const { GET, POST } = auth.handler
  ```
- [ ] 1.8 Verify `GET http://localhost:3000/api/auth/session` returns `{ session: null }` when app is running
