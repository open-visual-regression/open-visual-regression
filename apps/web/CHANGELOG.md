# @ovr/web

## 0.3.1

### Patch Changes

- [#158](https://github.com/open-visual-regression/open-visual-regression/pull/158) [`a6cb125`](https://github.com/open-visual-regression/open-visual-regression/commit/a6cb1257e46d5e5b4fc0e732a67736da99c5e85a) Thanks [@tgfischer](https://github.com/tgfischer)! - Compare snapshots against their baselines in parallel.

  The diff worker ran at BullMQ's default concurrency of one, so a build's
  snapshots were compared strictly one at a time. Each comparison downloads the
  capture and its baseline from object storage and decodes both PNGs, so on
  remote S3 a large build spent minutes in a queue that used a single core and
  one request at a time.

  It now runs `OVR_DIFF_CONCURRENCY` (default `4`, `worker.diffConcurrency` in
  the chart) comparisons at once. Worker memory scales with it, since each
  comparison holds the capture, its baseline, and the diff image uncompressed.

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

## 0.3.0

### Minor Changes

- [#150](https://github.com/open-visual-regression/open-visual-regression/pull/150) [`4913f2c`](https://github.com/open-visual-regression/open-visual-regression/commit/4913f2cd40cc83102df8b67e33de6e6763e1ffc4) Thanks [@tgfischer](https://github.com/tgfischer)! - Name the migration Job after the app version it migrates to.

  The name previously carried `.Release.Revision`, which increments under
  `helm upgrade` but is always `1` when the chart is rendered with
  `helm template` — so under Argo CD every release reused one name.

  `hook-delete-policy: before-hook-creation` deletes the previous Job, and
  `hook-succeeded` only removes Jobs that passed. A constant name therefore
  destroyed a _failed_ migration, and its pod logs, as soon as the next upgrade
  ran. Keying the name to `.Chart.AppVersion` varies per release under both
  Helm and `helm template`, so a failed migration survives the upgrade that
  follows it.

- [#149](https://github.com/open-visual-regression/open-visual-regression/pull/149) [`004cece`](https://github.com/open-visual-regression/open-visual-regression/commit/004cece28ddc4ed536d37b1e334601a57a8e60c8) Thanks [@tgfischer](https://github.com/tgfischer)! - Remove the chart's global `image.digest`.

  `web` and `worker` are different images and cannot share a digest, so a value
  set there produced a valid manifest pointing at the wrong image for at least
  one of them. Digests are pinned per component instead, with `web.image.digest`
  and `worker.image.digest`, which already existed and are unchanged.

  This is breaking for anyone setting `image.digest`. The values schema rejects
  the key, so an upgrade fails with a schema error rather than quietly deploying
  an unpinned image. Global `image.registry`, `image.tag` and `image.pullPolicy`
  are unaffected.

## 0.2.1

### Patch Changes

- [#139](https://github.com/open-visual-regression/open-visual-regression/pull/139) [`81b2201`](https://github.com/open-visual-regression/open-visual-regression/commit/81b220148f98e4e35ac49462af112719c088d1ff) Thanks [@tgfischer](https://github.com/tgfischer)! - Route all remaining logging through the shared application logger.

  better-auth wrote to its own console logger, and the worker, the builds
  retention module and bull-board wrote to `console` directly. That output
  ignored `LOG_LEVEL` and did not match the structured format everything else
  emits. It now goes through `@ovr/logger`.

  The `ovr` CLI and the database migrate script still write to `console`, since
  that output is the program's own interface rather than logging.

- Updated dependencies [[`81b2201`](https://github.com/open-visual-regression/open-visual-regression/commit/81b220148f98e4e35ac49462af112719c088d1ff)]:
  - @ovr/builds@0.1.1
  - @ovr/reviews@0.1.1

## 0.2.0

### Minor Changes

- [#113](https://github.com/open-visual-regression/open-visual-regression/pull/113) [`7dcfe9a`](https://github.com/open-visual-regression/open-visual-regression/commit/7dcfe9a2d85e1096956c6b7616fb97ed5a89ef6d) Thanks [@tgfischer](https://github.com/tgfischer)! - Show the running version in the sidebar, and publish `linux/arm64` images alongside `linux/amd64`.

### Patch Changes

- Updated dependencies []:
  - @ovr/ui@0.0.0
