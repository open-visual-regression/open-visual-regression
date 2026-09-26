---
"@open-visual-regression/cli": minor
"@ovr/api": patch
"@ovr/web": patch
"@ovr/builds": patch
---

Add `upload storybook --only-affected`, which only captures the stories a
change can affect.

The CLI asks the server for the last successful main-branch build in the
current commit's history (the new `builds.findAncestorBuild`), lists the files
changed since that build's commit, and traces them through the Storybook's
module graph. Every other story is uploaded as unaffected and keeps its
baselines. The Storybook must be built with `--stats-json`, and CI needs the
full git history.

Whenever it cannot tell — no main-branch build to compare against, a shallow
clone that does not reach it, a lockfile or Storybook configuration change,
or a changed non-code file in a package the Storybook bundles — it captures
every story and prints why. `onlyAffected.externals` and
`onlyAffected.untraced` in `ovr.config` widen or narrow what counts.
