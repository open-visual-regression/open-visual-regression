# 18 · Invite flow

Gate: admin clicks "invite user", fills form, submits; invite URL appears in accent Alert; banner is dismissable; cancel invite removes the row.

Read: `openspec/designs/screens/open-visual-regression/project/kit/screens-admin.jsx` (InviteModalScreen)

- [ ] 1.1 `packages/api/src/contracts/invitations.ts` — add `invite` + `cancelInvitation` contracts:
  - `invite`: input `{ email, role: "user" | "admin" }`; output `{ inviteUrl: string }`
  - `cancelInvitation`: input `{ invitationId }`; output void
  - Update `contracts/index.ts`

- [ ] 1.2 `apps/web/lib/router/invitations.ts` — add `invite` + `cancelInvitation` handlers:
  - `invite`: validate admin session; `auth.api.createInvitation({ email, role })`; return `{ inviteUrl }`; `.actionable()`
  - `cancelInvitation`: validate admin session; `auth.api.cancelInvitation({ invitationId })`; `.actionable()`

- [ ] 1.3 `InviteModal.tsx` (`"use client"`):
  - Dialog triggered by "invite user" button
  - Fields: email (required) + role toggle (radio: "user" [default] / "admin")
  - Note: "no email will be sent — share the invite link directly"
  - `useServerAction(router.invitations.invite, { interceptors: [onSuccess(({ inviteUrl }) => showInviteAlert(inviteUrl)), onError(...)] })`
  - On success: close dialog; show invite URL in accent-tone `Alert` "invite link" + copy button + dismiss ×
  - Copy: `navigator.clipboard.writeText(url)`
  - Alert persists until dismissed

- [ ] 1.4 Cancel invitation in invitations table:
  - Cancel button per row → `useServerAction(router.invitations.cancelInvitation)`; row disappears on revalidation

- [ ] 1.5 Component tests:
  - Modal opens on button click; closes on cancel
  - Invite URL Alert renders after successful submission
  - Alert dismisses on × click
  - Cancel removes invitation from table
