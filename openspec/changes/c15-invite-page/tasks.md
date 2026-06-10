# 15 · /invite/[id] page

Gate: valid invite token renders "create account" form; submitting creates user + session + redirects to /; expired/used token shows error state.

Read: `openspec/designs/screens/open-visual-regression/project/kit/screens-auth.jsx` (InviteScreen)

- [ ] 1.1 `apps/web/app/(unauthenticated)/invite/[invitationId]/page.tsx` (RSC):
  - Load invitation via `auth.api.getInvitation({ invitationId })`
  - Expired or not-found → error state: OvrMark + "this invitation has expired or is no longer valid" + link to contact admin
  - Valid: render form with email pre-filled (read-only), name field, password, confirm password

- [ ] 1.2 `packages/api/src/contracts/invitations.ts`: `acceptInvitation` contract (input: `{ invitationId, name, password }`; output: void); update `contracts/index.ts`

- [ ] 1.3 `apps/web/lib/router/invitations.ts`: `"use server"`; `acceptInvitation` handler via `os.invitations.acceptInvitation`:
  - Validate name + password (≥ 8 chars) — throw `ORPCError("BAD_REQUEST")` with field errors
  - `auth.api.createUser` → `auth.api.signInEmail` → `auth.api.acceptInvitation` in sequence
  - `.actionable()`; update `router/index.ts`

- [ ] 1.4 Invite form (`"use client"` component):
  - `useServerAction(router.invitations.acceptInvitation, { interceptors: [onSuccess(() => navigate.push("/")), onError(...)] })`
  - Password mismatch validated client-side with `react-hook-form`

- [x] 1.5 Add sign-out to authenticated layout:
  - Sign-out item in TopBar user avatar dropdown → calls `authClient.signOut()` + `window.location.href = "/login"`

- [ ] 1.6 Component tests:
  - Expired token shows error state (no form)
  - Valid token shows pre-filled email + form fields
  - Password mismatch shows inline error without calling action
  - Successful submission redirects to /
