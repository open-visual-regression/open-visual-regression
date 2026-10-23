---
"@ovr/capture": patch
"@ovr/worker": patch
---

A story that freezes the capture page no longer holds up the rest of its capture group. Each snapshot now has 60 seconds plus its `waitForTimeout` to capture. When it runs out, the worker relaunches the browser and tries that snapshot once more, then marks it errored with the step it got stuck on and moves on to the next one.
