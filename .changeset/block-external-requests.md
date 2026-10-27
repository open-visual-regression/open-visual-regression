---
"@open-visual-regression/cli": minor
"@ovr/worker": minor
"@ovr/web": minor
"@ovr/api": patch
"@ovr/builds": patch
"@ovr/capture": patch
"@ovr/capture-browser": patch
"@ovr/db": patch
"@ovr/queue": patch
"@ovr/storybook-compat": patch
---

External hosts aren't blocked by default. Set `blockExternalRequests` in `ovr.config.ts` to block them, either all (`true`) or all but some (`{ allow: ["images.example.com"] }`), and override it for one story with `parameters.ovr.blockExternalRequests`.
