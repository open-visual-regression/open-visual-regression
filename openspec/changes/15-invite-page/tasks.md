# 15 · /invite/[id] page

Gate: valid invite token renders "create account" form; submitting creates user + session; expired/used token shows error state.

Read: `openspec/designs/screens/open-visual-regression/project/kit/screens-auth.jsx` (InviteScreen)

- [ ] 1.1 Create `apps/web/app/invite/[invitationId]/page.tsx` (RSC):
  - Load invitation via `auth.api.getInvitation({ invitationId })`
  - Expired or not-found → render error state: OvrMark + "this invitation has expired or is no longer valid" + link to contact admin
  - Already used → same error state
  - Valid: render "create account" form with email pre-filled (read-only), name field, password, confirm password
- [ ] 1.2 Create `apps/web/app/invite/[invitationId]/actions.ts`:
  - `acceptInvitation(invitationId, formData)` Server Action
  - Validate: name + password + confirm password
  - Call `auth.api.createUser` → `auth.api.signInEmail` → `auth.api.acceptInvitation` in sequence
  - On success: `redirect("/projects")`
  - On failure: return `{ error: string }`
- [ ] 1.3 Add sign-out Server Action to `apps/web/app/(app)/actions.ts`; add sign-out item to TopBar user avatar dropdown
- [ ] 1.4 Component tests:
  - Expired token shows error state (no form)
  - Valid token shows pre-filled email + form fields
  - Password mismatch shows inline error
  - Successful submission calls action + redirects
