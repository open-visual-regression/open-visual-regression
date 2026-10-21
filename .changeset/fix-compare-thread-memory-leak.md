---
"@ovr/capture": patch
"@ovr/worker": patch
---

Fix a worker memory leak in snapshot diffs: the image comparison thread never ran its event loop, so each diff image it encoded stayed in memory until the worker was OOMKilled. A capture browser that fails while setting up its page, and the capture group's static file server, are now closed instead of leaked. The worker logs a `worker memory` line every minute with RSS, heap, external memory and its live browser processes (`OVR_MEMORY_LOG_INTERVAL_MS`, `0` to turn it off), and `pnpm --filter @ovr/worker soak` runs a memory soak against a real Storybook build.
