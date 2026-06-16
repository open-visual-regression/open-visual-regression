# 24 · New project

Gate: submitting the new-project form creates the project and redirects to its settings page with a "next step" hint.

Depends on: c21-project-schema (done)

Read: `openspec/designs/screens/open-visual-regression/project/kit/screens-projects.jsx` (NewProjectScreen)

- [x] `packages/api/src/contracts/projects.ts`: `addProjectContract` (input: `{ projectName, projectDescription, gitMainBranch, diffThreshold }` → `{ projectId }`)
- [x] `apps/web/lib/router/projects.ts`: `add` handler
- [x] `apps/web/app/(authenticated)/projects/new/_components/new-project-form/NewProjectForm.tsx`: form with all fields; validation; calls `router.projects.add`

- [ ] 1.1 Update `NewProjectForm` success handler to redirect to `/projects/[projectId]/settings?created=1` — land after `c25-project-settings` (settings layout must handle the `?created=1` toast first)
- [ ] 1.2 Component tests:
  - Required fields show inline validation errors without calling the action
  - Successful submission redirects to `/projects/[projectId]/settings?created=1`
  - Server error renders a root-level form error
