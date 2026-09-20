---
"@open-visual-regression/cli": minor
---

Add `ovr snapshots get`.

A snapshot's console and error logs are captured on every build but were not
reachable from anywhere in the CLI — the dashboard was the only way to see why a
story errored. `ovr snapshots get <snapshotId>` prints the snapshot's status,
story, browser, viewport and image path, whether the page threw an uncaught
error, and its captured logs, so a failing snapshot can be root-caused from a
build id without opening a browser.
