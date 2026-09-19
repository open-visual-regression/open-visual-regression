---
"@open-visual-regression/cli": minor
---

Add `ovr diffs get`.

A snapshot's diff — its pixel diff count, diff percentage and baseline — was
only visible in the dashboard, so confirming whether a `needs_review` snapshot
is a real regression or an intentional change meant leaving the terminal.
`ovr diffs get <snapshotId>` prints all of it, including the baseline's commit
and a link to it when the project has a git integration, so a diff can be
sized up from the CLI before deciding whether to open the review page.
