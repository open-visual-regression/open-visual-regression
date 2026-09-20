---
"@ovr/api": minor
"@ovr/web": minor
---

Add a `snapshots.getImageUrls` procedure.

Downloading a snapshot's images meant resolving three storage paths from two
procedures and then presigning each one separately, and the only way to presign
was `storage.getObject`, which takes a caller-supplied path and infers the
project from its first path segment. That is fine for an `<img src>` the app
built, but it makes authorization depend on the shape of a storage key.

`snapshots.getImageUrls` takes a snapshot id instead and resolves ownership
through `organizationSnapshotMiddleware`, the same guard the other `snapshots.*`
procedures use, then returns presigned URLs for the capture, its baseline and
its diff in one call. Each URL is null when that image does not exist, so a
snapshot with no baseline or no diff is not an error. The presigned URL lifetime
now lives in `router/utils/presignedUrls.ts`, shared with the storage route so
it and the cache header derived from it cannot drift apart.
