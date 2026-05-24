# 26 · Delete project

Gate: danger zone button opens AlertDialog showing counts; confirm button disabled until slug typed exactly; on confirm project is deleted and user redirected to /projects.

Read: `openspec/designs/screens/open-visual-regression/project/kit/screens-projects.jsx` (DeleteProjectScreen)

- [ ] 1.1 Create `apps/web/app/(app)/projects/[slug]/settings/DeleteProjectDialog.tsx` (`"use client"`):
  - Trigger: "delete project" destructive button in danger zone at bottom of settings page
  - `AlertDialog` with:
    - Title: "delete [project name]"
    - Body: counts from `deleteProject` service preview — "this will permanently delete N runs, N snapshots, and all associated storage"
    - Slug confirmation input: label "type [slug] to confirm"; tracks typed value in state
    - Confirm button: destructive variant; `disabled` until `typedSlug === project.slug`
    - Cancel button: secondary variant

- [ ] 1.2 Add `deleteProject(projectId, slug)` to `apps/web/app/(app)/projects/[slug]/settings/actions.ts`:
  - Validate caller is admin
  - Calls `projectsService.deleteProject(projectId, callerId)`
  - `redirect("/projects")`

- [ ] 1.3 Load deletion counts server-side when dialog opens:
  - Either pre-fetch counts in page RSC and pass as props, or
  - Fetch counts via a Server Action call when dialog mounts

- [ ] 1.4 Component tests:
  - Dialog renders with correct project name in title
  - Confirm button disabled by default
  - Typing wrong slug: confirm remains disabled
  - Typing exact slug: confirm enabled
  - Confirm calls action + redirects
