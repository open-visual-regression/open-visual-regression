---
"@ovr/capture-browser": patch
"@ovr/capture": patch
"@ovr/worker": minor
"@ovr/web": minor
"@open-visual-regression/cli": patch
---

Stories with a canvas, video, iframe, or shadow DOM are retaken until two screenshots match, so animating charts no longer flake. Set `OVR_SCREENSHOT_STABILITY=off` to turn it off.
