---
"@ovr/web": patch
"@ovr/worker": patch
"@ovr/capture": patch
---

Keep capturing a group's snapshots while earlier screenshots upload.

A capture group awaited each screenshot's upload to object storage before it
rendered the next snapshot, so every snapshot in the build paid the round trip
to storage in series. Against remote S3 that put minutes of pure network wait
on the capture path of a large build.

Uploads now run alongside the next snapshot's render, with at most two in
flight so a group holds only a bounded number of screenshots in memory. A
group still finishes every upload before its job completes, and a failed
upload still errors only its own snapshot and enqueues its diff, so the build
finalizes rather than hanging. An upload that fails outright, or that is
interrupted by a worker shutdown, still fails the group so the job is
retried.
