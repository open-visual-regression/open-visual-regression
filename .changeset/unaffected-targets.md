---
"@ovr/api": patch
"@ovr/web": patch
"@ovr/worker": patch
"@ovr/db": patch
"@ovr/builds": patch
"@ovr/capture": patch
"@ovr/queue": patch
---

Let an upload mark targets its changes cannot affect.

`builds.confirmUpload` takes `unaffectedTargetIds`. Each of those targets is
listed on the build as skipped on every viewport and keeps its baselines,
instead of being captured and diffed. A target is still captured on any
viewport it has no baseline for yet, so a new story or viewport is never
skipped. The ids are stored with the build's extract defaults, so a rebuild
skips the same targets.
