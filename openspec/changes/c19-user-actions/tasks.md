# 19 · User actions

Gate: admin can remove an active member or cancel a pending invitation; self-targeting is blocked; bulk removal works.

> **Design divergence from original spec.** The original plan was `changeRole` (promote/demote) + `deactivateUser` (ban). The implementation instead built `remove`, which hard-removes both active members (via `auth.api.removeMember`) and pending invitations (via `auth.api.cancelInvitation`) in a single bulk-capable action. Role changes are not yet implemented.

## What was built

- [x] `packages/api/src/contracts/users.ts`: `remove` contract — discriminated union input: `{ status: "active", email }` | `{ status: "invited", invitationId }`; wrapped in `{ users: [...] }` for bulk; output: void
- [x] `apps/web/lib/router/users.ts`: `remove` handler — blocks self-removal; calls `auth.api.removeMember` for active users, `auth.api.cancelInvitation` for invited; reports first error if any
- [x] `UsersTableBulkActions.tsx` + `RemoveUsersModal.tsx` — bulk-select rows, confirm removal in modal; calls `useServerAction(router.users.remove)`
- [x] Integration guard: attempting to remove self throws `BAD_REQUEST`

## Still needed

- [ ] 1.1 `changeRole` contract + router handler (if still in scope):
  - `packages/api/src/contracts/users.ts`: add `changeRole` (input: `{ userId, role: "user" | "admin" }`; output: void)
  - `apps/web/lib/router/users.ts`: if `input.userId === context.user.id` → `FORBIDDEN`; else `auth.api.setRole(...)`
  - Self-targeting test + happy-path test

- [ ] 1.2 Per-row role switcher in `UsersTable`:
  - Dropdown or inline toggle: "make admin" / "make user" based on current role
  - Disabled on own row with tooltip "cannot change your own role"
