# 18 · Invite flow

Gate: admin clicks "invite user", fills form, submits; invite URL appears in accent Alert banner; banner is dismissable; cancel invite removes the row.

Read: `openspec/designs/screens/open-visual-regression/project/kit/screens-admin.jsx` (InviteModalScreen)

- [ ] 1.1 Create `apps/web/app/(app)/settings/users/InviteModal.tsx` (`"use client"`):
  - Dialog triggered by "invite user" button in page header
  - Fields: email (required) + role toggle (radio: "user" [default] / "admin")
  - Note text below form: "no email will be sent — share the invite link directly"
  - Submit button: "send invitation" (primary variant)
  - On success: close dialog; show invite URL in accent-tone `Alert` with `AlertTitle` "invite link" + copy button + dismiss ×
  - Alert persists until dismissed (no auto-dismiss)
  - Copy button: `navigator.clipboard.writeText(url)`
- [ ] 1.2 Create `apps/web/app/(app)/settings/users/actions.ts`:
  - `inviteUser(email, role)` Server Action → calls `auth.api.createInvitation`; returns `{ inviteUrl: string }` or `{ error: string }`; revalidates page
  - `cancelInvitation(invitationId)` Server Action → calls `auth.api.cancelInvitation`; revalidates page
- [ ] 1.3 Wire cancel button in invitations table → calls `cancelInvitation` action; row disappears on revalidation
- [ ] 1.4 Component tests:
  - Modal opens on button click; closes on cancel
  - Invite URL Alert renders after successful submission
  - Alert dismisses on × click
  - Cancel action removes invitation from table
