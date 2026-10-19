---
"@ovr/capture": patch
"@ovr/worker": patch
---

Launch a fresh browser for each capture group again instead of sharing one browser per worker and parking booted Storybook pages between groups, which let worker memory grow until it ran out. A browser whose page fails to boot is now closed instead of leaked.
