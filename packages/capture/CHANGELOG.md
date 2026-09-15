# @ovr/capture

## 0.2.1

### Patch Changes

- [#192](https://github.com/open-visual-regression/open-visual-regression/pull/192) [`9313ec5`](https://github.com/open-visual-regression/open-visual-regression/commit/9313ec5922380c62f09d53116de8c0cc25ae816b) Thanks [@tgfischer](https://github.com/tgfischer)! - Wait for a story's images and network requests before screenshotting it.

  Capture gated the screenshot on Storybook's `storyFinished` event, which fires
  once the component has rendered — it says nothing about whether an `<img>` has
  loaded or a `fetch` in an effect has resolved. Stories that load images or call
  an API were screenshotted mid-flight, so the same story could come out with its
  content one run and a skeleton the next.

  Capture now adds a settle phase between the render and the screenshot: it waits
  for the page's in-flight requests to go quiet, for webfonts to be ready, and for
  the resulting paint to land. The phase is bounded, so a story that never goes
  quiet is still captured rather than failed, and its time shows up alongside the
  existing render and screenshot timings.

- [#193](https://github.com/open-visual-regression/open-visual-regression/pull/193) [`de97317`](https://github.com/open-visual-regression/open-visual-regression/commit/de97317558e17710728384dfe93a5f65ba4b57c2) Thanks [@tgfischer](https://github.com/tgfischer)! - Re-render a story Storybook reports as unchanged.

  A story captured at more than one viewport is asked for twice on the same page.
  The second request made Storybook emit `storyUnchanged`, which capture treated
  as a successful render — so the screenshot was taken with no re-render, no play
  function, and no settling time after the viewport resize. Responsive images and
  anything the resize kicked off were caught mid-flight, which is why a story
  could look right at one viewport and unloaded at another.

  Capture now forces a remount when Storybook reports the story unchanged, so
  every snapshot waits on a real render and its play function regardless of what
  the page was showing before.

- Updated dependencies [[`270db0e`](https://github.com/open-visual-regression/open-visual-regression/commit/270db0e0d44f4b62716df326198c6366b71ee3b3)]:
  - @ovr/db@0.2.1
  - @ovr/builds@0.1.5
  - @ovr/queue@0.1.3
  - @ovr/reviews@0.1.5

## 0.2.0

### Minor Changes

- [#189](https://github.com/open-visual-regression/open-visual-regression/pull/189) [`bf346a2`](https://github.com/open-visual-regression/open-visual-regression/commit/bf346a26490a2b02589f94ce714dd8ac54cebf94) Thanks [@tgfischer](https://github.com/tgfischer)! - Show a skipped story on the build as `skipped`.

  A story with `parameters.ovr.skip` produced no snapshot at all, so it vanished
  from the build with nothing to say it had ever been there. It now gets one
  snapshot per story, in a new `skipped` status: nothing is captured, diffed, or
  queued for review, but the story is visible on the build, in the status filter,
  and in the build's snapshot counts.

  The diff-completion check ignores skipped snapshots, so they neither hold a
  build open nor get swept up when one is canceled or reaped.

### Patch Changes

- [#189](https://github.com/open-visual-regression/open-visual-regression/pull/189) [`bf346a2`](https://github.com/open-visual-regression/open-visual-regression/commit/bf346a26490a2b02589f94ce714dd8ac54cebf94) Thanks [@tgfischer](https://github.com/tgfischer)! - Finalize a build when every story is skipped.

  A build whose stories all set `parameters.ovr.skip` has nothing to capture, and
  so no diffs to finalize it. It stayed in `processing` until the reaper timed it
  out; it now resolves as unchanged.

  A story that fails to load now reports that, rather than "Could not read
  viewport overrides".

- Updated dependencies [[`4d82876`](https://github.com/open-visual-regression/open-visual-regression/commit/4d828762aa9e5a8e49345d58f2276d18f3467127), [`bf346a2`](https://github.com/open-visual-regression/open-visual-regression/commit/bf346a26490a2b02589f94ce714dd8ac54cebf94), [`bf346a2`](https://github.com/open-visual-regression/open-visual-regression/commit/bf346a26490a2b02589f94ce714dd8ac54cebf94)]:
  - @ovr/db@0.2.0
  - @ovr/storybook-compat@0.2.0
  - @ovr/reviews@0.1.4
  - @ovr/builds@0.1.4
  - @ovr/queue@0.1.2

## 0.1.3

### Patch Changes

- [#175](https://github.com/open-visual-regression/open-visual-regression/pull/175) [`dff0593`](https://github.com/open-visual-regression/open-visual-regression/commit/dff059342ca035643a693fb6a459a3d948a451ee) Thanks [@tgfischer](https://github.com/tgfischer)! - Only mark a snapshot errored when the story itself failed to render.

  An uncaught exception seen through Playwright's `pageerror` event was folded
  into `hasRenderError`, alongside the render and play failures Storybook reports
  over its own channel. A story that rendered correctly and then threw — an error
  a boundary already recovered from, or one raised from a timer after the story
  finished — was marked errored, skipped its diff, and failed its build, even
  though its screenshot was perfectly usable.

  `hasRenderError` now comes only from Storybook's render and play result. The
  `pageerror` signal is kept separately as `hasUncaughtPageError`, which leaves
  the snapshot diffable and raises a warning on it instead. A snapshot also
  records the reason it errored in `errorMessage`, so it names what went wrong
  rather than always reading "This snapshot failed to capture", and a build whose
  snapshots errored says so instead of reporting a failure to diff against a
  baseline.

- Updated dependencies [[`37027a0`](https://github.com/open-visual-regression/open-visual-regression/commit/37027a0d7d3df3b87d11a7e47bedac2498838f39), [`dff0593`](https://github.com/open-visual-regression/open-visual-regression/commit/dff059342ca035643a693fb6a459a3d948a451ee)]:
  - @ovr/db@0.1.1
  - @ovr/builds@0.1.3
  - @ovr/queue@0.1.1
  - @ovr/reviews@0.1.3

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
