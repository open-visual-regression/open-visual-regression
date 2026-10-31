---
"@ovr/capture-browser": patch
"@ovr/capture": patch
"@ovr/storybook-compat": patch
"@ovr/builds": patch
"@ovr/api": patch
"@ovr/db": patch
"@ovr/queue": patch
"@ovr/worker": minor
"@ovr/web": minor
"@open-visual-regression/cli": minor
---

Stories with a canvas, video, iframe, or shadow DOM are retaken until two screenshots match, so animating charts no longer flake. Set `screenshotStability` in `ovr.config.ts` or `parameters.ovr` to change it.
