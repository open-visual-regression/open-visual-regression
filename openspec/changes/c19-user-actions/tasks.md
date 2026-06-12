# 19 · User actions (role change + deactivate)

Gate: admin can promote/demote a user's role; admin can deactivate a user; self-targeting either action is blocked.

- [ ] 1.1 `packages/api/src/contracts/users.ts`: `changeRole` contract (input: `{ userId, role }`; output: void) + `deactivateUser` contract (input: `{ userId }`; output: void); update `contracts/index.ts`

- [ ] 1.2 `apps/web/lib/router/users.ts`: `"use server"`; each handler `.use(authenticatedMiddleware).use(adminMiddleware)` + `.actionable()`:
  - `changeRole`: if `input.userId === context.user.id` → `throw new ORPCError("FORBIDDEN")`; else `auth.api.setRole({ userId: input.userId, role: input.role })`
  - `deactivateUser`: if `input.userId === context.user.id` → `throw new ORPCError("FORBIDDEN")`; else `auth.api.banUser({ userId: input.userId })`
  - Update `router/index.ts`

- [ ] 1.3 Integration tests (`apps/web/lib/router/__tests__/users.integration.test.ts`):
  - `changeRole` targeting self → `FORBIDDEN`
  - `deactivateUser` targeting self → `FORBIDDEN`
  - `changeRole` on another user → role updated via Better Auth
  - `deactivateUser` on another user → user banned via Better Auth

- [ ] 1.4 Wire actions menu in members table (`"use client"` component):
  - `DropdownMenu` per row: "make admin" / "make user" (based on role) + separator + "deactivate"
  - Both actions use `useServerAction`; revalidate page on success
  - Self row: all items disabled with tooltip "cannot modify your own account"
  - Deactivated user row: only "restore" item (disabled, not yet implemented)

- [ ] 1.5 Component tests:
  - Actions menu on own row: all items disabled
  - Actions menu on other row: items enabled; correct action called on click
