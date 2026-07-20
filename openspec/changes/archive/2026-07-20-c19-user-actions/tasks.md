# 19 · User actions

Gate: admin can remove an active member or cancel a pending invitation; self-targeting is blocked; bulk removal works; admin can promote or demote another user's role.

- [x] `packages/api/src/contracts/users.ts`: `remove` contract — discriminated union input: `{ status: "active", email }` | `{ status: "invited", invitationId }`; wrapped in `{ users: [...] }` for bulk; output: void
- [x] `apps/web/lib/router/users.ts`: `remove` handler — blocks self-removal; calls `auth.api.removeMember` for active users, `auth.api.cancelInvitation` for invited; reports first error if any
- [x] `UsersTableBulkActions.tsx` + `RemoveUsersModal.tsx` — bulk-select rows, confirm removal in modal; calls `useServerAction(router.users.remove)`

- [x] 1.1 `packages/api/src/contracts/users.ts`: add `changeRole` contract (input: `{ userId, role: "user" | "admin" }`; output: void); update index
- [x] 1.2 `apps/web/lib/router/users.ts`: `changeRole` handler `.use(authenticatedMiddleware).use(adminMiddleware)` + `.actionable()`:
  - inline self-target guard → `throw new ORPCError("FORBIDDEN")`; handler calls `authServerClient.setRole({ userId, role })`
- [x] 1.3 Integration tests:
  - `changeRole` unauthenticated → `UNAUTHORIZED`; non-admin → `FORBIDDEN`
  - `changeRole` targeting self → `FORBIDDEN`
  - `changeRole` on another user → role promoted/demoted
- [x] 1.4 Per-row role switcher in `UsersTable` (`RoleActions` `"use client"` component):
  - Role badge is the dropdown trigger; `DropdownMenuRadioGroup` with `admin` / `user`
  - Static badge (no switcher) on own row and invited rows
  - `useServerAction(serverClient.users.changeRole)`; `router.refresh()` on success, toast on error
