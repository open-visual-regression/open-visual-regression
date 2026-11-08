# @ovr/db

## 0.4.10

### Patch Changes

- [#503](https://github.com/open-visual-regression/open-visual-regression/pull/503) [`262896c`](https://github.com/open-visual-regression/open-visual-regression/commit/262896c9d13281d663b35043d978cf28d3577d20) Thanks [@tgfischer](https://github.com/tgfischer)! - New metrics show how long builds of each size wait to start capturing, where capture time goes, and how busy capture workers are. See the metrics docs for the full list.

- [#510](https://github.com/open-visual-regression/open-visual-regression/pull/510) [`d1e0df9`](https://github.com/open-visual-regression/open-visual-regression/commit/d1e0df997134d11a400af9b19ef73e5dcfdb9946) Thanks [@tgfischer](https://github.com/tgfischer)! - Upgrading runs a migration that records how each project's git integration authenticates, ahead of GitHub App support. Existing token integrations keep working unchanged.

- [#512](https://github.com/open-visual-regression/open-visual-regression/pull/512) [`00c28b4`](https://github.com/open-visual-regression/open-visual-regression/commit/00c28b42590817756c2fd1ccc742a57abd62f22e) Thanks [@tgfischer](https://github.com/tgfischer)! - Projects can publish commit statuses as a GitHub App instead of with a personal token. When the deployment has an App configured, choose "github app" under the project's git integration settings.

- [#502](https://github.com/open-visual-regression/open-visual-regression/pull/502) [`35a89cd`](https://github.com/open-visual-regression/open-visual-regression/commit/35a89cdeba96008d143a4a745e614e25170fa017) Thanks [@tgfischer](https://github.com/tgfischer)! - The snapshots page loads quickly again on large databases, instead of scanning every snapshot. Upgrading adds two small indexes on in-flight snapshots and pending diffs.

## 0.4.9

### Patch Changes

- [#498](https://github.com/open-visual-regression/open-visual-regression/pull/498) [`1ce7c07`](https://github.com/open-visual-regression/open-visual-regression/commit/1ce7c073cc1af4371be0cc4529f7a17a4ab29487) Thanks [@tgfischer](https://github.com/tgfischer)! - The snapshots page no longer repeats snapshots once per build. It shows each project's latest main build, or in-flight snapshots on any build when filtered to queued or processing.

## 0.4.8

### Patch Changes

- [#490](https://github.com/open-visual-regression/open-visual-regression/pull/490) [`f487ace`](https://github.com/open-visual-regression/open-visual-regression/commit/f487acea37219c51971d0e7e1c49105010f8fbbf) Thanks [@tgfischer](https://github.com/tgfischer)! - Adds a table for the baselines main changes and a merge-base column on builds, in preparation for comparing branches against main as it was when they were cut. The upgrade builds the new index without blocking the running app.

- [#479](https://github.com/open-visual-regression/open-visual-regression/pull/479) [`74b77e8`](https://github.com/open-visual-regression/open-visual-regression/commit/74b77e87cef549db2931d5eb2253a54c74d9e003) Thanks [@tgfischer](https://github.com/tgfischer)! - `snapshots.listStatuses`, `listBrowsers`, `listViewports` and `listFlags` return the options across every build when no `buildId` is given.

- [#478](https://github.com/open-visual-regression/open-visual-regression/pull/478) [`86af061`](https://github.com/open-visual-regression/open-visual-regression/commit/86af0617a3af2c134c8f3942800c139e12649455) Thanks [@tgfischer](https://github.com/tgfischer)! - `snapshots.list` lists every build's snapshots when no `buildId` is given, sorted by status or alphabetically, with each snapshot's build and project. Upgrading adds an index on snapshots without locking the table.

- [#480](https://github.com/open-visual-regression/open-visual-regression/pull/480) [`ae2504c`](https://github.com/open-visual-regression/open-visual-regression/commit/ae2504ccd335bdb4e213982749565e89baf4d2a9) Thanks [@tgfischer](https://github.com/tgfischer)! - `snapshots.list` filters by `projectIds`, and `baseline: true` keeps only snapshots that are their project's current baseline.

- [#489](https://github.com/open-visual-regression/open-visual-regression/pull/489) [`4972a24`](https://github.com/open-visual-regression/open-visual-regression/commit/4972a24b5ad6dfd46eb2d1cf9f9464f61c1bbf5c) Thanks [@tgfischer](https://github.com/tgfischer)! - Metrics, alerts, and dashboard panels cover object storage: request failures and latency, deleted files, and files of purged builds or projects left in storage.

## 0.4.7

### Patch Changes

- [#473](https://github.com/open-visual-regression/open-visual-regression/pull/473) [`4e4e7a3`](https://github.com/open-visual-regression/open-visual-regression/commit/4e4e7a3928396d4d56b6e339dcacd1901f673a7b) Thanks [@tgfischer](https://github.com/tgfischer)! - Updates Next.js, Better Auth, and other dependencies to fix security advisories. A migration makes the `account.issuer` column, which Better Auth no longer uses, nullable.

- [#475](https://github.com/open-visual-regression/open-visual-regression/pull/475) [`f297ce1`](https://github.com/open-visual-regression/open-visual-regression/commit/f297ce19aad59bf2b9e90d89bdf844c0bc4be039) Thanks [@tgfischer](https://github.com/tgfischer)! - You can now rebuild a snapshot as soon as it has been captured and compared, even while the rest of its build is still running. Before, the rebuild button stayed hidden until the whole build finished.

- [#476](https://github.com/open-visual-regression/open-visual-regression/pull/476) [`9caa71f`](https://github.com/open-visual-regression/open-visual-regression/commit/9caa71f69f9f64d008ae71f12ee80650c01cc7ce) Thanks [@tgfischer](https://github.com/tgfischer)! - Stories with a canvas, video, iframe, or shadow DOM are retaken until two screenshots match, so animating charts no longer flake. Set `screenshotStability` in `ovr.config.ts` or `parameters.ovr` to change it.

## 0.4.6

### Patch Changes

- [#454](https://github.com/open-visual-regression/open-visual-regression/pull/454) [`7a73f92`](https://github.com/open-visual-regression/open-visual-regression/commit/7a73f92fcdbd28af33cb9b8b0b96b3bc66f9be70) Thanks [@tgfischer](https://github.com/tgfischer)! - External hosts aren't blocked by default. Set `blockExternalRequests` in `ovr.config.ts` to block them, either all (`true`) or all but some (`{ allow: ["images.example.com"] }`), and override it for one story with `parameters.ovr.blockExternalRequests`. Stories that load images or fonts from another host may change once, since those now load.

## 0.4.5

### Patch Changes

- [#428](https://github.com/open-visual-regression/open-visual-regression/pull/428) [`79276f2`](https://github.com/open-visual-regression/open-visual-regression/commit/79276f236ad32d79fab0b5ad9494697490b2d562) Thanks [@tgfischer](https://github.com/tgfischer)! - Stop failing builds with "Build timed out" while they are still waiting in the queue.

## 0.4.4

### Patch Changes

- [#417](https://github.com/open-visual-regression/open-visual-regression/pull/417) [`26e384d`](https://github.com/open-visual-regression/open-visual-regression/commit/26e384dce69f59d73896bf27bb95860329bab761) Thanks [@tgfischer](https://github.com/tgfischer)! - The daily retention purge is gentler on small databases. It deletes expired builds in small batches with a pause between them, stops after a per-project time budget, runs one project at a time across all workers, and logs a summary for each project. Tune it with `OVR_PURGE_CONCURRENCY`, `OVR_PURGE_BATCH_SIZE`, `OVR_PURGE_BATCH_PAUSE_MS` and `OVR_PURGE_TIME_BUDGET_MS`, or `worker.purge.*` in the Helm chart.

## 0.4.3

### Patch Changes

- [#415](https://github.com/open-visual-regression/open-visual-regression/pull/415) [`1784c87`](https://github.com/open-visual-regression/open-visual-regression/commit/1784c87b7a55ef8b685122595695f2584b4cf448) Thanks [@tgfischer](https://github.com/tgfischer)! - Pull request builds now show the same flaky snapshots as main-branch builds. `flags[].matchesEarlierVariant` is deprecated and always false.

- [#413](https://github.com/open-visual-regression/open-visual-regression/pull/413) [`a269a15`](https://github.com/open-visual-regression/open-visual-regression/commit/a269a15f46915c5d027387a7f97583d8f0bc45ee) Thanks [@tgfischer](https://github.com/tgfischer)! - Capture and diff workers no longer spend time on builds that have already errored or been canceled. A queued capture group for such a build finishes without downloading the Storybook bundle or launching a browser, snapshots the build reaper already errored are no longer captured, and reaping a build now removes its waiting capture and diff jobs from the queue. Snapshots the reaper errors now get an errored diff, so retrying some of them lets the build settle instead of waiting to be reaped again.

## 0.4.2

### Patch Changes

- [#357](https://github.com/open-visual-regression/open-visual-regression/pull/357) [`6f32f54`](https://github.com/open-visual-regression/open-visual-regression/commit/6f32f54c5d60542e3c25fbdc6f6feb98a26373d9) Thanks [@tgfischer](https://github.com/tgfischer)! - Stop a database migration from stalling the running app while it waits for a table lock. A migration now gives up on a lock after 5 seconds and retries, instead of waiting indefinitely while every other query on that table queues behind it.

- [#356](https://github.com/open-visual-regression/open-visual-regression/pull/356) [`ecf4162`](https://github.com/open-visual-regression/open-visual-regression/commit/ecf41625621ccb55b5953932a21058264af44c08) Thanks [@tgfischer](https://github.com/tgfischer)! - Apply each database migration in its own transaction instead of all pending migrations in one, so upgrading across several releases no longer deadlocks with the running web and worker pods. Only one migrator runs at a time.

## 0.4.1

### Patch Changes

- [#348](https://github.com/open-visual-regression/open-visual-regression/pull/348) [`0d851dc`](https://github.com/open-visual-regression/open-visual-regression/commit/0d851dc7ef40b62a768fde90552fc8bfec95b58f) Thanks [@tgfischer](https://github.com/tgfischer)! - Check whether a build has finished processing with a single query instead of loading every snapshot after each diff.

## 0.4.0

### Minor Changes

- [#339](https://github.com/open-visual-regression/open-visual-regression/pull/339) [`dd78378`](https://github.com/open-visual-regression/open-visual-regression/commit/dd78378a08d5225a897ba1c8124bc0f8252f913b) Thanks [@tgfischer](https://github.com/tgfischer)! - Add `ovr snapshots history` to show a snapshot's screenshot across recent builds.

## 0.3.0

### Minor Changes

- [#307](https://github.com/open-visual-regression/open-visual-regression/pull/307) [`1a46b57`](https://github.com/open-visual-regression/open-visual-regression/commit/1a46b5760e151026056a0f7b5162b8991e97806c) Thanks [@tgfischer](https://github.com/tgfischer)! - Show when flaky detection last ran and add a "run now" button to the jobs page. Running saves any unsaved changes first, so it runs with the settings on screen. The button is disabled with a spinner while a run is in progress, and the page refreshes until the run finishes. Starting a run is refused when flaky detection is disabled or already running.

## 0.2.8

### Patch Changes

- [#300](https://github.com/open-visual-regression/open-visual-regression/pull/300) [`c1f0578`](https://github.com/open-visual-regression/open-visual-regression/commit/c1f0578966bd70195900367943cc9db9511b2789) Thanks [@tgfischer](https://github.com/tgfischer)! - Store settings for background jobs so they can be configured from the app.

- [#294](https://github.com/open-visual-regression/open-visual-regression/pull/294) [`43e1f76`](https://github.com/open-visual-regression/open-visual-regression/commit/43e1f763904fd2d3b7f807205faad089a8db9db9) Thanks [@tgfischer](https://github.com/tgfischer)! - Filter a build's snapshots by whether they are flaky or have warnings.

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
