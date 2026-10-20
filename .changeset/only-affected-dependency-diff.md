---
"@open-visual-regression/cli": minor
"@ovr/web": minor
---

`ovr upload storybook --only-affected` no longer captures every story for changes that can't change what renders. Lockfile and `package.json` changes are compared package by package and only capture every story when a package in the Storybook bundle, or one that builds it, changed version, so upgrading the OVR CLI captures nothing on its own. Changes to `ovr.config` only capture every story when they change `waitForTimeout`; viewport changes are captured at any viewport a story has no baseline for. The CLI prints the main-branch build it compared against, and the build page shows why every story was captured.
