# 24 · New project

Gate: submitting the new-project form creates the project and redirects to its settings page with a "next step" hint.

Depends on: c21-project-schema

Read: `openspec/designs/screens/open-visual-regression/project/kit/screens-projects.jsx` (NewProjectScreen)

Projects have no `slug` — they're identified by `id` (uuid), so there's no slug auto-derive or conflict check. The contract (`addProjectContract` in `packages/api/src/contracts/projects.ts`), router handler (`apps/web/lib/router/projects.ts` → `add`), and form (`apps/web/app/(authenticated)/projects/new/_components/new-project-form/NewProjectForm.tsx`) already implement project creation with `{ projectName, projectDescription, gitMainBranch, diffThreshold }` → `{ projectId }`.

- [ ] 1.1 Update `NewProjectForm`'s success handler to redirect to `/projects/[projectId]/settings?created=1` (currently redirects to `/projects`), once `c25-project-settings` lands

- [ ] 1.2 Component tests:
  - Required fields show inline validation errors without calling the action
  - Successful submission redirects to `/projects/[projectId]/settings?created=1`
  - Server error renders a root-level form error
