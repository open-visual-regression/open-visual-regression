---
"@open-visual-regression/cli": minor
"@ovr/web": minor
"@ovr/worker": minor
"@ovr/capture": minor
---

Add a `waitForTimeout` option to wait a fixed number of milliseconds before a story's screenshot is taken, for stories whose data or images take a while to load. Set it for every story in `ovr.config.ts`, or for one story with `parameters.ovr.waitForTimeout`. Defaults to `0`, at most `30000`.
