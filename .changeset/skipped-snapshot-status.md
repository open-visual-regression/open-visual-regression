---
"@ovr/db": minor
"@ovr/api": minor
"@ovr/capture": minor
"@ovr/ui": minor
"@ovr/mocks": minor
"@open-visual-regression/cli": patch
---

Show a skipped story on the build as `skipped`.

A story with `parameters.ovr.skip` produced no snapshot at all, so it vanished
from the build with nothing to say it had ever been there. It now gets one
snapshot per story, in a new `skipped` status: nothing is captured, diffed, or
queued for review, but the story is visible on the build, in the status filter,
and in the build's snapshot counts.

The diff-completion check ignores skipped snapshots, so they neither hold a
build open nor get swept up when one is canceled or reaped.
