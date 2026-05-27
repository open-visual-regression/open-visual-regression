# 24 · /projects/new page

Gate: slug auto-derives from name input; inline conflict error disables submit; successful creation redirects to settings with "next step" hint.

Read: `openspec/designs/screens/open-visual-regression/project/kit/screens-projects.jsx` (NewProjectScreen)

- [ ] 1.1 Create `apps/web/app/(authenticated)/projects/new/page.tsx` (`"use client"` — needs controlled input for slug derivation):
  - Fields:
    - name: text input; on change → derive slug (kebab-case, lowercase, replace spaces with `-`, strip non-alphanum-hyphen)
    - slug: text input with `/` prefix shown as label; user can override auto-derived value; validate on blur + on change
    - default branch: text input; default "main"
  - Slug validation: debounce 400ms; call `/api/projects/slug-check?slug=X`; show inline error "slug already in use" below field; disable submit while conflict exists or while checking
  - Submit button: primary, "create project"; disabled during conflict check or on known conflict

- [ ] 1.2 Create `apps/web/app/api/projects/slug-check/route.ts`:
  - `GET ?slug=X` → `{ available: boolean }`; no auth required to check (slug is not sensitive)

- [ ] 1.3 Create `apps/web/app/(authenticated)/projects/new/actions.ts`:
  - `createProject(formData)` Server Action
  - Validate with Zod: name required; slug required + valid pattern; defaultBranch required
  - Call `projectsService.createProject(...)` → on `SlugConflictError` return `{ error: "slug already in use" }`
  - On success: `redirect("/projects/" + slug + "/settings?created=1")` (the `?created=1` param triggers "next step" toast in settings page)

- [ ] 1.4 Component tests:
  - Name input typing derives slug correctly
  - Slug conflict: inline error appears; submit disabled
  - Slug available: error cleared; submit enabled
  - Successful submission calls action + redirects
