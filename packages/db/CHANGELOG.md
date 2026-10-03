# @ovr/db

## 0.2.7

### Patch Changes

- [#290](https://github.com/open-visual-regression/open-visual-regression/pull/290) [`925dfb7`](https://github.com/open-visual-regression/open-visual-regression/commit/925dfb762442ab2fc021edf33bfdd087a2246785) Thanks [@tgfischer](https://github.com/tgfischer)! - Mark a feature-branch snapshot as flaky when its change matches a look the story already had on main.

- [#287](https://github.com/open-visual-regression/open-visual-regression/pull/287) [`2188523`](https://github.com/open-visual-regression/open-visual-regression/commit/21885235b03d37d3bb2c8cca94cecf7d570cbd91) Thanks [@tgfischer](https://github.com/tgfischer)! - Check stories for flakiness on a schedule. Turn it on with `OVR_FLAKY_DETECTION_ENABLED`, or `worker.flakyDetection.enabled` in the Helm chart, and set how often it runs with `OVR_FLAKY_DETECTION_CRON`.

- [#288](https://github.com/open-visual-regression/open-visual-regression/pull/288) [`1651aaf`](https://github.com/open-visual-regression/open-visual-regression/commit/1651aaf99b25db20472c486080bbc87b0b13588e) Thanks [@tgfischer](https://github.com/tgfischer)! - Report whether each snapshot is flaky.

- [#286](https://github.com/open-visual-regression/open-visual-regression/pull/286) [`f5744e5`](https://github.com/open-visual-regression/open-visual-regression/commit/f5744e59bd6663553adf517b4efc5ee985ad32bb) Thanks [@tgfischer](https://github.com/tgfischer)! - Identify stories whose screenshots keep changing between main-branch builds.

- [#282](https://github.com/open-visual-regression/open-visual-regression/pull/282) [`85ebeca`](https://github.com/open-visual-regression/open-visual-regression/commit/85ebeca9697afe1ce475cb4b25d8012efa70409c) Thanks [@tgfischer](https://github.com/tgfischer)! - Fix a newer baseline being replaced by an older main-branch build that finished later.

- [#283](https://github.com/open-visual-regression/open-visual-regression/pull/283) [`4c3d8c6`](https://github.com/open-visual-regression/open-visual-regression/commit/4c3d8c6b7143869b1f8d7ece13feaa1acae558ad) Thanks [@tgfischer](https://github.com/tgfischer)! - Record a fingerprint of each captured screenshot.

- [#285](https://github.com/open-visual-regression/open-visual-regression/pull/285) [`65c8f48`](https://github.com/open-visual-regression/open-visual-regression/commit/65c8f4824fe4cf4642fd3ad8b261d30ded2a6a68) Thanks [@tgfischer](https://github.com/tgfischer)! - Keep track of the distinct looks each story has had on the main branch.

## 0.2.6

### Patch Changes

- [#262](https://github.com/open-visual-regression/open-visual-regression/pull/262) [`4ecd06f`](https://github.com/open-visual-regression/open-visual-regression/commit/4ecd06f3927efe6b17865e6d877e7f5692164238) Thanks [@tgfischer](https://github.com/tgfischer)! - Fix a finished build occasionally getting every snapshot twice and going back to processing when its extract job ran again, for example after the worker restarted mid-extract.

## 0.2.5

### Patch Changes

- [#257](https://github.com/open-visual-regression/open-visual-regression/pull/257) [`4177ca9`](https://github.com/open-visual-regression/open-visual-regression/commit/4177ca9e0503839b9c40b34041ef9e981076edf4) Thanks [@tgfischer](https://github.com/tgfischer)! - Show a warning badge on snapshot cards when the story rendered with an uncaught error.

## 0.2.4

### Patch Changes

- [#241](https://github.com/open-visual-regression/open-visual-regression/pull/241) [`16d2294`](https://github.com/open-visual-regression/open-visual-regression/commit/16d22944b317faf70e5b54f256231c4f73816aee) Thanks [@tgfischer](https://github.com/tgfischer)! - Let an upload skip targets its changes can't affect. Skipped targets keep their baselines.

## 0.2.3

### Patch Changes

- [#236](https://github.com/open-visual-regression/open-visual-regression/pull/236) [`9edbf39`](https://github.com/open-visual-regression/open-visual-regression/commit/9edbf39d9dc6b56d1529668611c54d557067bbe8) Thanks [@tgfischer](https://github.com/tgfischer)! - Index `snapshot_logs.snapshot_id` to speed up loading the snapshot page.

## 0.2.2

### Patch Changes

- [#223](https://github.com/open-visual-regression/open-visual-regression/pull/223) [`9ba80f1`](https://github.com/open-visual-regression/open-visual-regression/commit/9ba80f10bf007bd5741f58ca1c5282f88b4e92b6) Thanks [@tgfischer](https://github.com/tgfischer)! - Add `rebuildSnapshots`, which re-captures individual snapshots of a settled
  build in place.

  Each snapshot is requeued and its previous capture, logs, diff and review
  votes are discarded, the build returns to `processing`, and the capture
  groups the snapshots belong to are queued again. A rebuild is refused while
  the build is still running, once it has been canceled, once a newer build
  has landed on the branch (its baseline stands), and for stories the build
  was told to skip.

- [#222](https://github.com/open-visual-regression/open-visual-regression/pull/222) [`2273afc`](https://github.com/open-visual-regression/open-visual-regression/commit/2273afc3e92f607a538bb5ca7c7f931495b476d1) Thanks [@tgfischer](https://github.com/tgfischer)! - Scope a snapshot's screenshot to the capture attempt that produced it.

  Snapshots now record a capture attempt, and each attempt uploads to its own
  path. Re-capturing a snapshot no longer overwrites the image an earlier attempt
  uploaded, which the presigned-URL cache would otherwise keep serving.

## 0.2.1

### Patch Changes

- [#191](https://github.com/open-visual-regression/open-visual-regression/pull/191) [`270db0e`](https://github.com/open-visual-regression/open-visual-regression/commit/270db0e0d44f4b62716df326198c6366b71ee3b3) Thanks [@tgfischer](https://github.com/tgfischer)! - Return a build's snapshots in a stable order.

  `snapshots.findByBuild` had no `ORDER BY`, so Postgres was free to return a
  build's rows in any order. Capture groups are chunked straight out of that
  list, so which snapshots shared a warm browser — and in what sequence — could
  change between runs of the same build. Stories that load images or make
  network requests captured differently depending on whether they landed on a
  cold or an already-warm page, which showed up as snapshots flipping between
  loaded and unloaded content.

  Snapshots now come back ordered by story, browser, and viewport, which also
  puts a story's viewports next to each other in the same capture group.

## 0.2.0

### Minor Changes

- [#186](https://github.com/open-visual-regression/open-visual-regression/pull/186) [`4d82876`](https://github.com/open-visual-regression/open-visual-regression/commit/4d828762aa9e5a8e49345d58f2276d18f3467127) Thanks [@tgfischer](https://github.com/tgfischer)! - Let `builds.list` filter by commit SHA.

  Adds a `commitShas` filter alongside the existing `branches` and `authors`
  filters, so a caller that already knows a commit (an agent in a repo
  checkout, say) can look up its build directly instead of filtering client-side
  through a full branch listing.

- [#189](https://github.com/open-visual-regression/open-visual-regression/pull/189) [`bf346a2`](https://github.com/open-visual-regression/open-visual-regression/commit/bf346a26490a2b02589f94ce714dd8ac54cebf94) Thanks [@tgfischer](https://github.com/tgfischer)! - Show a skipped story on the build as `skipped`.

  A story with `parameters.ovr.skip` produced no snapshot at all, so it vanished
  from the build with nothing to say it had ever been there. It now gets one
  snapshot per story, in a new `skipped` status: nothing is captured, diffed, or
  queued for review, but the story is visible on the build, in the status filter,
  and in the build's snapshot counts.

  The diff-completion check ignores skipped snapshots, so they neither hold a
  build open nor get swept up when one is canceled or reaped.

## 0.1.1

### Patch Changes

- [#181](https://github.com/open-visual-regression/open-visual-regression/pull/181) [`37027a0`](https://github.com/open-visual-regression/open-visual-regression/commit/37027a0d7d3df3b87d11a7e47bedac2498838f39) Thanks [@tgfischer](https://github.com/tgfischer)! - Stop an idle database connection from crashing the process.

  The connection pool had no `error` listener. node-postgres emits `error` on the
  pool when a backend or network fault hits an **idle** client, and an `error`
  event with no listener becomes an uncaught exception — so the process exited 1
  and the container restarted.

  Neon's pooler drops idle connections, so the worker hit this whenever it sat
  between builds: three restarts over eight days in the dogfood deployment, each
  after hours of inactivity, all `Connection terminated unexpectedly` thrown from
  `Client.idleListener`. The pool already replaces dead clients on its own; it
  just needed the fault logged instead of thrown.

  Web was unaffected in practice only because its traffic kept connections from
  going idle.

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
