# 22 · Projects service

**Dissolved** — service functions distributed into the vertical slice specs that need them:

- `createProject` + `SlugConflictError` → c24-new-project
- `updateProject` → c25-project-settings
- `addVariant` + `removeVariant` + `LimitExceededError` → c25-project-settings
- `deleteProject` → c26-delete-project

Error base classes (`SlugConflictError`, `LimitExceededError`, `SelfActionError`, `ForbiddenError`) in `packages/services/src/errors.ts` — create in whichever spec lands first (c24).
