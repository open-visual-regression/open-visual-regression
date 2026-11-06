---
"@ovr/worker": minor
"@ovr/web": minor
"@open-visual-regression/cli": minor
"@ovr/capture": patch
"@ovr/capture-browser": patch
---

Capture stops waiting for a request after 5 seconds instead of 15. Set `OVR_CAPTURE_REQUEST_TIMEOUT_MS=15000` on the worker to keep the previous limit.
