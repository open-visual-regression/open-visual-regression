# 19 · User actions

Gate: admin can remove an active member or cancel a pending invitation; self-targeting is blocked; bulk removal works; admin can promote or demote another user's role.

- [x] `packages/api/src/contracts/users.ts`: `remove` contract — discriminated union input: `{ status: "active", email }` | `{ status: "invited", invitationId }`; wrapped in `{ users: [...] }` for bulk; output: void
- [x] `apps/web/lib/router/users.ts`: `remove` handler — blocks self-removal; calls `auth.api.removeMember` for active users, `auth.api.cancelInvitation` for invited; reports first error if any
- [x] `UsersTableBulkActions.tsx` + `RemoveUsersModal.tsx` — bulk-select rows, confirm removal in modal; calls `useServerAction(router.users.remove)`

- [ ] 1.1 `packages/api/src/contracts/users.ts`: add `changeRole` contract (input: `{ userId, role: "user" | "admin" }`; output: void); update index
- [ ] 1.2 `apps/web/lib/router/users.ts`: `changeRole` handler `.use(authenticatedMiddleware).use(adminMiddleware)` + `.actionable()`:
  - if `input.userId === context.user.id` → `throw new ORPCError("FORBIDDEN")`; else `auth.api.setRole({ userId: input.userId, role: input.role })`
- [ ] 1.3 Integration tests:
  - `changeRole` targeting self → `FORBIDDEN`
  - `changeRole` on another user → role updated
- [ ] 1.4 Per-row role switcher in `UsersTable` (`"use client"` component):
  - Dropdown or inline toggle: "make admin" / "make user" based on current role
  - Disabled on own row with tooltip "cannot change your own role"
  - `useServerAction(router.users.changeRole)`; revalidate on success
