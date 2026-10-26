---
"@ovr/capture": patch
"@ovr/capture-browser": patch
"@ovr/worker": patch
---

Capture browsers that fail to close are now force-killed, so they no longer leak memory in the worker. A capture group that times out now kills its browser instead of leaving it running, and the worker kills any browser still running while it has no capture or extract job, counting each one in `ovr_worker_browser_processes_killed_total`.
