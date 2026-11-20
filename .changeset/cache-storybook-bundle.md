---
"@ovr/capture-browser": patch
"@open-visual-regression/cli": patch
"@ovr/worker": patch
---

Reloading Storybook during a capture reuses the bundle the browser already loaded, so `ovr capture storybook --repeat` and browser relaunches no longer download and parse the whole bundle again.
