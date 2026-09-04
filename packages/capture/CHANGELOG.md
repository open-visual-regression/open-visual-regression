# @ovr/capture

## 0.1.2

### Patch Changes

- [#157](https://github.com/open-visual-regression/open-visual-regression/pull/157) [`fed2be3`](https://github.com/open-visual-regression/open-visual-regression/commit/fed2be3a3af19ae4f7ff3dd764e0905128f33855) Thanks [@tgfischer](https://github.com/tgfischer)! - Download a build's Storybook bundle once per worker instead of once per capture group.

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

- [#160](https://github.com/open-visual-regression/open-visual-regression/pull/160) [`30a88aa`](https://github.com/open-visual-regression/open-visual-regression/commit/30a88aae1a42133119672932be713a42ceba0ee6) Thanks [@tgfischer](https://github.com/tgfischer)! - Keep capturing a group's snapshots while earlier screenshots upload.

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

- Updated dependencies [[`fed2be3`](https://github.com/open-visual-regression/open-visual-regression/commit/fed2be3a3af19ae4f7ff3dd764e0905128f33855)]:
  - @ovr/builds@0.1.2
  - @ovr/reviews@0.1.2

## 0.1.1

### Patch Changes

- Updated dependencies []:
  - @ovr/reviews@0.1.1
