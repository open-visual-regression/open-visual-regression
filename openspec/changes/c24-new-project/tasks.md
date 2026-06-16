# 24 · New project

Gate: submitting the new-project form creates the project and redirects to its settings page with a "next step" hint.

Depends on: c21-project-schema (done)

## What was built

- [x] `packages/api/src/contracts/projects.ts`: `addProjectContract` (input: `{ projectName, projectDescription, gitMainBranch, diffThreshold }` → `{ projectId }`)
- [x] `apps/web/lib/router/projects.ts`: `add` handler
- [x] `apps/web/app/(authenticated)/projects/new/_components/new-project-form/NewProjectForm.tsx`: form with all fields; validation; calls `router.projects.add`

## Still needed

- [ ] 1.1 Update `NewProjectForm` success handler: change `navigate.push("/projects")` → `navigate.push(\`/projects/\${projectId}/settings?created=1\`)` once `c25-project-settings` lands (settings layout must handle `?created=1` toast first)

- [ ] 1.2 Component tests:
  - Required fields show inline validation errors without calling the action
  - Successful submission redirects to `/projects/[projectId]/settings?created=1`
  - Server error renders a root-level form error
