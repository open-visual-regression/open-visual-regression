# 19 · User actions (role change + deactivate)

Gate: admin can promote/demote a user's role; admin can deactivate a user; self-targeting either action is blocked.

- [ ] 1.1 `packages/services/src/users.ts`:
  - `changeRole(targetUserId, role, callerId)`: throw `SelfActionError` if self; call `auth.api.setRole`
  - `deactivateUser(targetUserId, callerId)`: throw `SelfActionError` if self; call `auth.api.banUser`
  - Unit tests: self-targeting throws; valid call invokes Better Auth

- [ ] 1.2 `packages/api/src/contracts/users.ts`: `changeRole` contract (input: `{ userId, role }`; output: void) + `deactivateUser` contract (input: `{ userId }`; output: void); update `contracts/index.ts`

- [ ] 1.3 `apps/web/lib/router/users.ts`: `"use server"`;
  - `changeRole`: validate admin session; call `usersService.changeRole`; on `SelfActionError` → `ORPCError("FORBIDDEN")`; `.actionable()`
  - `deactivateUser`: validate admin session; call `usersService.deactivateUser`; on `SelfActionError` → `ORPCError("FORBIDDEN")`; `.actionable()`
  - Update `router/index.ts`

- [ ] 1.4 Wire actions menu in members table (`"use client"` component):
  - `DropdownMenu` per row: "make admin" / "make user" (based on role) + separator + "deactivate"
  - Both actions use `useServerAction`; revalidate page on success
  - Self row: all items disabled with tooltip "cannot modify your own account"
  - Deactivated user row: only "restore" item (disabled, not yet implemented)

- [ ] 1.5 Component tests:
  - Actions menu on own row: all items disabled
  - Actions menu on other row: items enabled; correct action called on click
