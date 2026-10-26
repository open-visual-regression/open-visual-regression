---
"@ovr/capture-browser": patch
"@ovr/capture": patch
"@ovr/worker": patch
"@open-visual-regression/cli": patch
---

Captures wait for the DOM to stop changing and for loaded images to decode, not just for the network to go quiet, so a story that renders in waves is no longer captured halfway.
