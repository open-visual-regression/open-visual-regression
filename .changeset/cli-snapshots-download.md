---
"@open-visual-regression/cli": minor
---

Add `ovr snapshots download`.

The paths `ovr snapshots get` and `ovr diffs get` print are storage keys, not
something that can be opened, so the images behind a failing snapshot were still
only viewable in the dashboard.

`ovr snapshots download <snapshotId>` writes the capture, its baseline and its
diff into `--out` as ordinary PNGs, fetching each from a presigned URL in a
single request to the server. An image the snapshot does not have is skipped and
named in the output rather than written as an empty file, so a first snapshot
with no baseline is not an error.
