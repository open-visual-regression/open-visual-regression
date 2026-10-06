---
"@ovr/api": patch
"@ovr/builds": patch
"@ovr/queue": patch
---

Share the flaky detection settings schema and its defaults between the worker and the API. `cronPatternSchema` moves from `@ovr/queue` to `@ovr/api/contracts/jobs`.
