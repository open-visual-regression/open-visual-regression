# @ovr/builds

## 0.1.11

### Patch Changes

- [#263](https://github.com/open-visual-regression/open-visual-regression/pull/263) [`01010bd`](https://github.com/open-visual-regression/open-visual-regression/commit/01010bdea54b07eda9bb4b2b131abd1055ee82a1) Thanks [@tgfischer](https://github.com/tgfischer)! - Fix a build staying in processing when it needed to finalize again after an earlier finalize had already run.

- Updated dependencies [[`01010bd`](https://github.com/open-visual-regression/open-visual-regression/commit/01010bdea54b07eda9bb4b2b131abd1055ee82a1), [`4ecd06f`](https://github.com/open-visual-regression/open-visual-regression/commit/4ecd06f3927efe6b17865e6d877e7f5692164238)]:
  - @ovr/queue@0.1.9
  - @ovr/db@0.2.6

## 0.1.10

### Patch Changes

- [#249](https://github.com/open-visual-regression/open-visual-regression/pull/249) [`73f7fda`](https://github.com/open-visual-regression/open-visual-regression/commit/73f7fda61041627356c9ad7a183efb4007f47ac0) Thanks [@tgfischer](https://github.com/tgfischer)! - Add an endpoint that returns a project's baseline build: the latest successful build on its main branch.

- Updated dependencies [[`4177ca9`](https://github.com/open-visual-regression/open-visual-regression/commit/4177ca9e0503839b9c40b34041ef9e981076edf4)]:
  - @ovr/db@0.2.5
  - @ovr/queue@0.1.8

## 0.1.9

### Patch Changes

- [#242](https://github.com/open-visual-regression/open-visual-regression/pull/242) [`aff53e1`](https://github.com/open-visual-regression/open-visual-regression/commit/aff53e1caa0235dd8c7283d0f8c6eef7cc2352a3) Thanks [@tgfischer](https://github.com/tgfischer)! - Add `upload storybook --only-affected` to capture only the stories a change can affect.

- [#241](https://github.com/open-visual-regression/open-visual-regression/pull/241) [`16d2294`](https://github.com/open-visual-regression/open-visual-regression/commit/16d22944b317faf70e5b54f256231c4f73816aee) Thanks [@tgfischer](https://github.com/tgfischer)! - Let an upload skip targets its changes can't affect. Skipped targets keep their baselines.

- Updated dependencies [[`16d2294`](https://github.com/open-visual-regression/open-visual-regression/commit/16d22944b317faf70e5b54f256231c4f73816aee)]:
  - @ovr/db@0.2.4
  - @ovr/queue@0.1.7

## 0.1.8

### Patch Changes

- Updated dependencies [[`9edbf39`](https://github.com/open-visual-regression/open-visual-regression/commit/9edbf39d9dc6b56d1529668611c54d557067bbe8)]:
  - @ovr/db@0.2.3
  - @ovr/queue@0.1.6

## 0.1.7

### Patch Changes

- Updated dependencies [[`7237920`](https://github.com/open-visual-regression/open-visual-regression/commit/72379203107e43351fbcc25628fccd0d1295bde7)]:
  - @ovr/queue@0.1.5

## 0.1.6

### Patch Changes

- [#223](https://github.com/open-visual-regression/open-visual-regression/pull/223) [`9ba80f1`](https://github.com/open-visual-regression/open-visual-regression/commit/9ba80f10bf007bd5741f58ca1c5282f88b4e92b6) Thanks [@tgfischer](https://github.com/tgfischer)! - Add `rebuildSnapshots`, which re-captures individual snapshots of a settled
  build in place.

  Each snapshot is requeued and its previous capture, logs, diff and review
  votes are discarded, the build returns to `processing`, and the capture
  groups the snapshots belong to are queued again. A rebuild is refused while
  the build is still running, once it has been canceled, once a newer build
  has landed on the branch (its baseline stands), and for stories the build
  was told to skip.

- Updated dependencies [[`2273afc`](https://github.com/open-visual-regression/open-visual-regression/commit/2273afc3e92f607a538bb5ca7c7f931495b476d1), [`9ba80f1`](https://github.com/open-visual-regression/open-visual-regression/commit/9ba80f10bf007bd5741f58ca1c5282f88b4e92b6), [`2273afc`](https://github.com/open-visual-regression/open-visual-regression/commit/2273afc3e92f607a538bb5ca7c7f931495b476d1)]:
  - @ovr/queue@0.1.4
  - @ovr/db@0.2.2

## 0.1.5

### Patch Changes

- Updated dependencies [[`270db0e`](https://github.com/open-visual-regression/open-visual-regression/commit/270db0e0d44f4b62716df326198c6366b71ee3b3)]:
  - @ovr/db@0.2.1
  - @ovr/queue@0.1.3

## 0.1.4

### Patch Changes

- Updated dependencies [[`4d82876`](https://github.com/open-visual-regression/open-visual-regression/commit/4d828762aa9e5a8e49345d58f2276d18f3467127), [`bf346a2`](https://github.com/open-visual-regression/open-visual-regression/commit/bf346a26490a2b02589f94ce714dd8ac54cebf94)]:
  - @ovr/db@0.2.0
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
  - @ovr/queue@0.1.1

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

## 0.1.1

### Patch Changes

- [#139](https://github.com/open-visual-regression/open-visual-regression/pull/139) [`81b2201`](https://github.com/open-visual-regression/open-visual-regression/commit/81b220148f98e4e35ac49462af112719c088d1ff) Thanks [@tgfischer](https://github.com/tgfischer)! - Route all remaining logging through the shared application logger.

  better-auth wrote to its own console logger, and the worker, the builds
  retention module and bull-board wrote to `console` directly. That output
  ignored `LOG_LEVEL` and did not match the structured format everything else
  emits. It now goes through `@ovr/logger`.

  The `ovr` CLI and the database migrate script still write to `console`, since
  that output is the program's own interface rather than logging.
