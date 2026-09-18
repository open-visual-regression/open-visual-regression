---
"@ovr/web": minor
---

Navigate every snapshot from the review page, following the build page's filters.

Forward/back were pinned to the review tier, so a build made entirely of
errored, unchanged, or auto-approved snapshots had no navigation at all. The
navigable set is now whatever the build page is showing — the same filters
(status, browser, viewport, search) the grid and its count already use, which
with no filters is every snapshot in the build.

Reviewing a snapshot under a filter (approving the last "needs review" item,
say) no longer blanks the controls or shrinks the count out from under the
reviewer: neighbors come from sort position rather than filter membership, and
the snapshot being viewed holds its place even once it stops matching.
