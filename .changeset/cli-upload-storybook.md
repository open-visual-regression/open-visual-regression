---
"@open-visual-regression/cli": minor
---

Rename `ovr snapshot storybook` to `ovr upload storybook`.

The CLI does not capture anything — it uploads a Storybook build and the server
screenshots and diffs it — so `snapshot` described the pipeline rather than the
command, and it sat one letter away from the new `ovr snapshots` group for
inspecting a build's snapshots.

`ovr snapshot storybook` still works and behaves identically, including its exit
codes, but prints a deprecation notice on stderr so stdout stays parseable. It
will be removed in the next major release.
