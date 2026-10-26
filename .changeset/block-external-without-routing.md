---
"@ovr/capture-browser": patch
"@ovr/capture": patch
"@ovr/worker": patch
"@open-visual-regression/cli": patch
---

Captures now wait for requests that a service worker answers, like msw mocks with a delay, instead of taking the screenshot while the story is still loading. External requests are still blocked, but by pointing the browser at a proxy that refuses them rather than by routing each request.
