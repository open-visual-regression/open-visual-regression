# 17 · Users page (read-only)

Gate: `/settings/users` renders pending invitations table and members table with correct data; non-admin gets 403.

Read: `openspec/designs/screens/open-visual-regression/project/kit/screens-admin.jsx` (UsersScreen)

- [ ] 1.1 Create `apps/web/app/(authenticated)/settings/users/page.tsx` (RSC):
  - Server-side: verify `session.user.role === "admin"`; if not → `notFound()` (renders 404)
  - Fetch pending invitations from Better Auth; fetch all organization members
  - Pending invitations table columns: email · invited-by name · issued date (relative) · expiry date · near-expiry warning `△` (when < 6h remaining) · copy button · cancel button placeholder
  - Members table columns: avatar (2-letter monogram, amber `var(--ovr-accent-primary)` bg, 24×24 square) · name + "(you)" label on current user · email · role badge · joined date · last-seen date · actions menu (disabled for now)
  - Deactivated members: 50% opacity row + `DEACTIVATED` Badge (fail tone, filled)
  - "invite user" button in page header (disabled/inert for now — wired in 18-invite-flow)
- [ ] 1.2 Component tests:
  - Admin user: renders both tables with mock data
  - Pending invitation near expiry shows `△` warning
  - Current user row shows "(you)"
  - Deactivated user shows opacity + badge
