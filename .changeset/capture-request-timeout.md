---
"@ovr/worker": minor
"@ovr/web": minor
"@open-visual-regression/cli": minor
"@ovr/capture": patch
"@ovr/capture-browser": patch
---

Capture now stops waiting for a request or image after 5 seconds instead of 15, so a broken image host slows builds far less. Set `OVR_CAPTURE_REQUEST_TIMEOUT_MS=15000` on the worker to keep the previous limit.
