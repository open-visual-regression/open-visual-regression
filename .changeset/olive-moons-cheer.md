---
"@ovr/web": patch
"@ovr/worker": patch
"@ovr/builds": patch
"@ovr/capture": patch
---

Download a build's Storybook bundle once per worker instead of once per capture group.

Capture groups each extracted the build artifact into their own temporary
directory and deleted it when the group finished, so a build split into 18
groups pulled the whole bundle out of object storage 18 times. On remote S3
that download, and the untar behind it, ran before the first screenshot of
every group.

Both the extract job and the capture groups now go through the Storybook
bundle cache the dashboard already used, so a build is fetched once per worker
and reused. Bundles still in use are exempt from cache eviction, so a capture
group cannot lose the files its browser is serving. `OVR_STORYBOOK_CACHE_BYTES`
(`worker.storybookCacheBytes` in the chart) caps what the cache keeps on disk.
