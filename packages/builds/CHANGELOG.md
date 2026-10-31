# @ovr/builds

## 0.2.11

### Patch Changes

- Updated dependencies [[`8db0612`](https://github.com/open-visual-regression/open-visual-regression/commit/8db0612ae6e6a2cd289a93ea8ec3c2f193f7cb5d), [`7afb831`](https://github.com/open-visual-regression/open-visual-regression/commit/7afb831f475a3451d9c7744583d5aefc2392068f), [`8d8e5be`](https://github.com/open-visual-regression/open-visual-regression/commit/8d8e5beed481201fcaa798d2c476067c2ec72efb)]:
  - @ovr/storybook-compat@0.4.2
  - @ovr/api@0.5.3

## 0.2.10

### Patch Changes

- [#454](https://github.com/open-visual-regression/open-visual-regression/pull/454) [`7a73f92`](https://github.com/open-visual-regression/open-visual-regression/commit/7a73f92fcdbd28af33cb9b8b0b96b3bc66f9be70) Thanks [@tgfischer](https://github.com/tgfischer)! - External hosts aren't blocked by default. Set `blockExternalRequests` in `ovr.config.ts` to block them, either all (`true`) or all but some (`{ allow: ["images.example.com"] }`), and override it for one story with `parameters.ovr.blockExternalRequests`. Stories that load images or fonts from another host may change once, since those now load.

- Updated dependencies [[`7a73f92`](https://github.com/open-visual-regression/open-visual-regression/commit/7a73f92fcdbd28af33cb9b8b0b96b3bc66f9be70), [`3ecc66d`](https://github.com/open-visual-regression/open-visual-regression/commit/3ecc66d08cd328b884dfe15560d7ed8ef9f0c2da)]:
  - @ovr/api@0.5.2
  - @ovr/db@0.4.6
  - @ovr/queue@0.2.8
  - @ovr/storybook-compat@0.4.1

## 0.2.9

### Patch Changes

- [#450](https://github.com/open-visual-regression/open-visual-regression/pull/450) [`1560be5`](https://github.com/open-visual-regression/open-visual-regression/commit/1560be58843ecd23b3c54c148451e8775cd6b26e) Thanks [@tgfischer](https://github.com/tgfischer)! - Keep a build queued until its first snapshot starts capturing, instead of showing it as processing while every snapshot is still queued.

## 0.2.8

### Patch Changes

- [#428](https://github.com/open-visual-regression/open-visual-regression/pull/428) [`79276f2`](https://github.com/open-visual-regression/open-visual-regression/commit/79276f236ad32d79fab0b5ad9494697490b2d562) Thanks [@tgfischer](https://github.com/tgfischer)! - Stop failing builds with "Build timed out" while they are still waiting in the queue.

- Updated dependencies [[`8bb7448`](https://github.com/open-visual-regression/open-visual-regression/commit/8bb74484257bc01831da1207be516dd01c3ad21c), [`79276f2`](https://github.com/open-visual-regression/open-visual-regression/commit/79276f236ad32d79fab0b5ad9494697490b2d562)]:
  - @ovr/queue@0.2.7
  - @ovr/db@0.4.5

## 0.2.7

### Patch Changes

- [#426](https://github.com/open-visual-regression/open-visual-regression/pull/426) [`c6930b4`](https://github.com/open-visual-regression/open-visual-regression/commit/c6930b404c01abf9b6a25cda64ce6a31c405edbd) Thanks [@tgfischer](https://github.com/tgfischer)! - Small builds no longer wait for every snapshot of a large build queued before them. Set `OVR_CAPTURE_QUEUE_POLICY=fifo` to keep the previous order.

- Updated dependencies [[`c6930b4`](https://github.com/open-visual-regression/open-visual-regression/commit/c6930b404c01abf9b6a25cda64ce6a31c405edbd)]:
  - @ovr/queue@0.2.6

## 0.2.6

### Patch Changes

- [#417](https://github.com/open-visual-regression/open-visual-regression/pull/417) [`26e384d`](https://github.com/open-visual-regression/open-visual-regression/commit/26e384dce69f59d73896bf27bb95860329bab761) Thanks [@tgfischer](https://github.com/tgfischer)! - The daily retention purge is gentler on small databases. It deletes expired builds in small batches with a pause between them, stops after a per-project time budget, runs one project at a time across all workers, and logs a summary for each project. Tune it with `OVR_PURGE_CONCURRENCY`, `OVR_PURGE_BATCH_SIZE`, `OVR_PURGE_BATCH_PAUSE_MS` and `OVR_PURGE_TIME_BUDGET_MS`, or `worker.purge.*` in the Helm chart.

- Updated dependencies [[`26e384d`](https://github.com/open-visual-regression/open-visual-regression/commit/26e384dce69f59d73896bf27bb95860329bab761)]:
  - @ovr/db@0.4.4
  - @ovr/queue@0.2.5

## 0.2.5

### Patch Changes

- [#413](https://github.com/open-visual-regression/open-visual-regression/pull/413) [`a269a15`](https://github.com/open-visual-regression/open-visual-regression/commit/a269a15f46915c5d027387a7f97583d8f0bc45ee) Thanks [@tgfischer](https://github.com/tgfischer)! - Capture and diff workers no longer spend time on builds that have already errored or been canceled. A queued capture group for such a build finishes without downloading the Storybook bundle or launching a browser, snapshots the build reaper already errored are no longer captured, and reaping a build now removes its waiting capture and diff jobs from the queue. Snapshots the reaper errors now get an errored diff, so retrying some of them lets the build settle instead of waiting to be reaped again.

- Updated dependencies [[`1784c87`](https://github.com/open-visual-regression/open-visual-regression/commit/1784c87b7a55ef8b685122595695f2584b4cf448), [`a269a15`](https://github.com/open-visual-regression/open-visual-regression/commit/a269a15f46915c5d027387a7f97583d8f0bc45ee)]:
  - @ovr/api@0.5.1
  - @ovr/db@0.4.3
  - @ovr/queue@0.2.4

## 0.2.4

### Patch Changes

- Updated dependencies [[`8e45f3a`](https://github.com/open-visual-regression/open-visual-regression/commit/8e45f3a709ea77e73beaad2fc96a1b1dcf407960)]:
  - @ovr/api@0.5.0

## 0.2.3

### Patch Changes

- Updated dependencies [[`6f32f54`](https://github.com/open-visual-regression/open-visual-regression/commit/6f32f54c5d60542e3c25fbdc6f6feb98a26373d9), [`ecf4162`](https://github.com/open-visual-regression/open-visual-regression/commit/ecf41625621ccb55b5953932a21058264af44c08)]:
  - @ovr/db@0.4.2
  - @ovr/queue@0.2.3

## 0.2.2

### Patch Changes

- [#351](https://github.com/open-visual-regression/open-visual-regression/pull/351) [`f9be809`](https://github.com/open-visual-regression/open-visual-regression/commit/f9be809548dc835fcaf9b9b1ac9c8964fe1c50cd) Thanks [@tgfischer](https://github.com/tgfischer)! - Log how long each build pipeline job waited in the queue, and each build's total duration and snapshot count when it finishes.

- Updated dependencies [[`0d851dc`](https://github.com/open-visual-regression/open-visual-regression/commit/0d851dc7ef40b62a768fde90552fc8bfec95b58f)]:
  - @ovr/db@0.4.1
  - @ovr/queue@0.2.2

## 0.2.1

### Patch Changes

- Updated dependencies [[`8f8c3fb`](https://github.com/open-visual-regression/open-visual-regression/commit/8f8c3fb945d6f91412f59d578b9bddf50a894048), [`23dce06`](https://github.com/open-visual-regression/open-visual-regression/commit/23dce063717c0cbb8b78a6b8ee7048287057848c), [`dd78378`](https://github.com/open-visual-regression/open-visual-regression/commit/dd78378a08d5225a897ba1c8124bc0f8252f913b)]:
  - @ovr/api@0.4.0
  - @ovr/db@0.4.0
  - @ovr/queue@0.2.1

## 0.2.0

### Minor Changes

- [#307](https://github.com/open-visual-regression/open-visual-regression/pull/307) [`1a46b57`](https://github.com/open-visual-regression/open-visual-regression/commit/1a46b5760e151026056a0f7b5162b8991e97806c) Thanks [@tgfischer](https://github.com/tgfischer)! - Show when flaky detection last ran and add a "run now" button to the jobs page. Running saves any unsaved changes first, so it runs with the settings on screen. The button is disabled with a spinner while a run is in progress, and the page refreshes until the run finishes. Starting a run is refused when flaky detection is disabled or already running.

### Patch Changes

- Updated dependencies [[`1a46b57`](https://github.com/open-visual-regression/open-visual-regression/commit/1a46b5760e151026056a0f7b5162b8991e97806c)]:
  - @ovr/api@0.3.0
  - @ovr/db@0.3.0
  - @ovr/queue@0.2.0

## 0.1.14

### Patch Changes

- [#303](https://github.com/open-visual-regression/open-visual-regression/pull/303) [`f059de4`](https://github.com/open-visual-regression/open-visual-regression/commit/f059de4dd22306ed975024b2680bd1d25d6fcfaa) Thanks [@tgfischer](https://github.com/tgfischer)! - Let admins read and update flaky detection settings through the API. Saving reschedules the flaky snapshot dispatch, so a new schedule applies without restarting the worker.

- [#301](https://github.com/open-visual-regression/open-visual-regression/pull/301) [`990c406`](https://github.com/open-visual-regression/open-visual-regression/commit/990c406d9b44c6c258fcc84b05d97497381306fe) Thanks [@tgfischer](https://github.com/tgfischer)! - Share the flaky detection settings schema and its defaults between the worker and the API. `cronPatternSchema` moves from `@ovr/queue` to `@ovr/api/contracts/jobs`.

- [#302](https://github.com/open-visual-regression/open-visual-regression/pull/302) [`839acca`](https://github.com/open-visual-regression/open-visual-regression/commit/839accaa17ba3e735f64cc62fdad9665a1e5d48c) Thanks [@tgfischer](https://github.com/tgfischer)! - Read flaky detection settings (on or off, schedule, and how many recent builds to consider) from the database instead of the `OVR_FLAKY_DETECTION_*` environment variables, which are removed along with `worker.flakyDetection` in the Helm chart. Remove `worker.flakyDetection` from your Helm values before upgrading; the chart's schema now rejects it.

- Updated dependencies [[`f059de4`](https://github.com/open-visual-regression/open-visual-regression/commit/f059de4dd22306ed975024b2680bd1d25d6fcfaa), [`c1f0578`](https://github.com/open-visual-regression/open-visual-regression/commit/c1f0578966bd70195900367943cc9db9511b2789), [`990c406`](https://github.com/open-visual-regression/open-visual-regression/commit/990c406d9b44c6c258fcc84b05d97497381306fe), [`839acca`](https://github.com/open-visual-regression/open-visual-regression/commit/839accaa17ba3e735f64cc62fdad9665a1e5d48c), [`756a5b3`](https://github.com/open-visual-regression/open-visual-regression/commit/756a5b38e9fee5c07525daf34227cca2c934842f), [`43e1f76`](https://github.com/open-visual-regression/open-visual-regression/commit/43e1f763904fd2d3b7f807205faad089a8db9db9)]:
  - @ovr/api@0.2.6
  - @ovr/queue@0.1.11
  - @ovr/db@0.2.8

## 0.1.13

### Patch Changes

- [#287](https://github.com/open-visual-regression/open-visual-regression/pull/287) [`2188523`](https://github.com/open-visual-regression/open-visual-regression/commit/21885235b03d37d3bb2c8cca94cecf7d570cbd91) Thanks [@tgfischer](https://github.com/tgfischer)! - Check stories for flakiness on a schedule. Turn it on with `OVR_FLAKY_DETECTION_ENABLED`, or `worker.flakyDetection.enabled` in the Helm chart, and set how often it runs with `OVR_FLAKY_DETECTION_CRON`.

- [#285](https://github.com/open-visual-regression/open-visual-regression/pull/285) [`65c8f48`](https://github.com/open-visual-regression/open-visual-regression/commit/65c8f4824fe4cf4642fd3ad8b261d30ded2a6a68) Thanks [@tgfischer](https://github.com/tgfischer)! - Keep track of the distinct looks each story has had on the main branch.

- Updated dependencies [[`925dfb7`](https://github.com/open-visual-regression/open-visual-regression/commit/925dfb762442ab2fc021edf33bfdd087a2246785), [`2188523`](https://github.com/open-visual-regression/open-visual-regression/commit/21885235b03d37d3bb2c8cca94cecf7d570cbd91), [`1651aaf`](https://github.com/open-visual-regression/open-visual-regression/commit/1651aaf99b25db20472c486080bbc87b0b13588e), [`f5744e5`](https://github.com/open-visual-regression/open-visual-regression/commit/f5744e59bd6663553adf517b4efc5ee985ad32bb), [`85ebeca`](https://github.com/open-visual-regression/open-visual-regression/commit/85ebeca9697afe1ce475cb4b25d8012efa70409c), [`4c3d8c6`](https://github.com/open-visual-regression/open-visual-regression/commit/4c3d8c6b7143869b1f8d7ece13feaa1acae558ad), [`65c8f48`](https://github.com/open-visual-regression/open-visual-regression/commit/65c8f4824fe4cf4642fd3ad8b261d30ded2a6a68)]:
  - @ovr/db@0.2.7
  - @ovr/queue@0.1.10

## 0.1.12

### Patch Changes

- [#281](https://github.com/open-visual-regression/open-visual-regression/pull/281) [`e78e057`](https://github.com/open-visual-regression/open-visual-regression/commit/e78e057c045bdbbff81939d6508a558823579c9a) Thanks [@tgfischer](https://github.com/tgfischer)! - Enforce review rules on the server instead of only hiding buttons. Voting on a snapshot is refused once a newer build has landed on the branch or the snapshot failed, and approving or rejecting a whole build is also refused while it is running, canceled, or errored. Build and snapshot details now expose `isReviewable` so the UI shows the review buttons only when a vote would be accepted.

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
