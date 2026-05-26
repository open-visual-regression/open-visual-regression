# 19 · User actions (role change + deactivate)

Gate: admin can promote/demote a user's role; admin can deactivate a user; self-targeting either action is blocked.

- [ ] 1.1 Create `packages/services/src/users.ts`:
  - `changeRole(targetUserId, role, callerId)`:
    - Throws `SelfActionError` if `targetUserId === callerId`
    - Calls Better Auth Admin plugin `setRole`
  - `deactivateUser(targetUserId, callerId)`:
    - Throws `SelfActionError` if `targetUserId === callerId`
    - Calls Better Auth Admin plugin `banUser`
- [ ] 1.2 Add to `apps/web/app/(authenticated)/settings/users/actions.ts`:
  - `changeRole(userId, role)` Server Action → validates admin session; calls service; revalidates
  - `deactivateUser(userId)` Server Action → validates admin session; calls service; revalidates
- [ ] 1.3 Wire actions menu in members table:
  - DropdownMenu per row with items: "make admin" / "make user" (depending on current role) + separator + "deactivate"
  - Self row: actions menu disabled (grayed out items with tooltip "cannot modify your own account")
  - Deactivated user row: only "restore" item (not implemented yet — show as disabled)
- [ ] 1.4 Unit tests for service functions:
  - `changeRole`: self-targeting throws; valid call invokes Ban Auth
  - `deactivateUser`: self-targeting throws; valid call invokes Better Auth
- [ ] 1.5 Component tests: actions menu on own row is disabled; actions menu on other rows is enabled
