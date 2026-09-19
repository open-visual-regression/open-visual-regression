---
"@open-visual-regression/cli": minor
---

Add `ovr snapshots list` and `ovr snapshots counts`.

A failing build could be found from the CLI but not opened: `builds get` reports
that a build needs review without saying which of its snapshots changed, so the
only way from a build ID to an actual regression was the dashboard.

`snapshots counts` breaks a build down by status, and `snapshots list` prints a
row per snapshot carrying its story, browser, viewport and the percentage of
pixels that differ from its baseline. Both take a personal access token, and
`list` accepts the same filters the dashboard uses — `--status`, `--browser`,
`--viewport` and `--search` — so `--status needs_review` narrows a build to just
the snapshots waiting on a decision. Pages are walked with `--limit`, `--cursor`
and `--all`.
