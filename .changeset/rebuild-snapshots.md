---
"@ovr/builds": patch
"@ovr/capture": patch
"@ovr/db": patch
---

Add `rebuildSnapshots`, which re-captures individual snapshots of a settled
build in place.

Each snapshot is requeued and its previous capture, logs, diff and review
votes are discarded, the build returns to `processing`, and the capture
groups the snapshots belong to are queued again. A rebuild is refused while
the build is still running, once it has been canceled, once a newer build
has landed on the branch (its baseline stands), and for stories the build
was told to skip.
