---
"@ovr/capture": patch
"@ovr/capture-browser": patch
"@ovr/worker": patch
---

Capture browsers that fail to close are now force-killed, so they no longer leak memory in the worker.
