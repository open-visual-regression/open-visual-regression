---
"@ovr/web": patch
---

Fix the sidebar loading skeleton still showing the main content's fallback in production builds. Wrapping the sidebar's parallel-route slot value in `<Suspense>` from the parent layout (the previous fix) crossed stream Suspense boundary IDs with the main content boundary under production's optimized bundle. Moving the `<Suspense>` boundary into the slot's own `default.tsx`, directly around the async component, resolves it correctly.
