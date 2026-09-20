# @ovr/web

## 0.5.0

### Minor Changes

- [#201](https://github.com/open-visual-regression/open-visual-regression/pull/201) [`f40afc2`](https://github.com/open-visual-regression/open-visual-regression/commit/f40afc28689e5afb1cd1b3c8f795f1e7c930a668) Thanks [@tgfischer](https://github.com/tgfischer)! - Add an all-builds page at `/builds`.

  It lists every build the caller can read, newest first, in the same infinite
  scrolling table the project page uses, and each row links to that build under
  its own project. Build rows now carry the project name in their metadata,
  after the author, and the sidebar's "recent builds" heading links to the new
  page.

  The list, its rows and the projects sidebar now live in `lib/components`,
  shared by both pages; filters and search stay project-scoped for now.

- [#204](https://github.com/open-visual-regression/open-visual-regression/pull/204) [`653118e`](https://github.com/open-visual-regression/open-visual-regression/commit/653118e3d6f0ae0dd81043e156cc3a723a67c14d) Thanks [@tgfischer](https://github.com/tgfischer)! - Filter and search the all-builds page at `/builds`.

  The status, branch and author dropdowns and the search box that the project
  page already had now sit on the all-builds page too, where their options span
  every project in the organization rather than a single one. Filters read from
  and write to the url, so a filtered view stays shareable and survives a
  reload.

  The filters, the search field and their facet popovers move to
  `lib/components`, shared by both pages, alongside the list and rows that moved
  there earlier.

- [#198](https://github.com/open-visual-regression/open-visual-regression/pull/198) [`0bf7208`](https://github.com/open-visual-regression/open-visual-regression/commit/0bf7208ef6b3e14543f78a85fdaf40b3445ab11c) Thanks [@tgfischer](https://github.com/tgfischer)! - Navigate every snapshot from the review page, following the build page's filters.

  Forward/back were pinned to the review tier, so a build made entirely of
  errored, unchanged, or auto-approved snapshots had no navigation at all. The
  navigable set is now whatever the build page is showing — the same filters
  (status, browser, viewport, search) the grid and its count already use, which
  with no filters is every snapshot in the build.

  Reviewing a snapshot under a filter (approving the last "needs review" item,
  say) no longer blanks the controls or shrinks the count out from under the
  reviewer: neighbors come from sort position rather than filter membership, and
  the snapshot being viewed holds its place even once it stops matching.

### Patch Changes

- [#199](https://github.com/open-visual-regression/open-visual-regression/pull/199) [`884bca3`](https://github.com/open-visual-regression/open-visual-regression/commit/884bca36b3ff6f188d4a130a2cc97d385fc94c6d) Thanks [@tgfischer](https://github.com/tgfischer)! - Keep the new api key on screen after it is created.

  Creating a key runs a server action, and Next.js re-renders the settings page
  with its result. For the first key in a project that swaps the "no api keys yet"
  empty state for the table — and the dialog lived inside that empty state, so it
  unmounted along with it. The reveal flashed on screen and vanished before the key
  could be copied, and because the key is only ever shown once it was lost for good.

  The dialog now wraps the whole api keys section instead of sitting next to one
  button, so both the header and empty state triggers open the same dialog and it
  stays open until it is dismissed, whatever the list underneath it does.

- Updated dependencies []:
  - @ovr/ui@0.1.0

## 0.4.1

### Patch Changes

- [#194](https://github.com/open-visual-regression/open-visual-regression/pull/194) [`6b79d4c`](https://github.com/open-visual-regression/open-visual-regression/commit/6b79d4c3e2fd1430e4c762cf26dc1a311358191b) Thanks [@tgfischer](https://github.com/tgfischer)! - Fall back to session auth when the `Authorization` header is not an OVR token.

  An OIDC reverse proxy in front of OVR (oauth2-proxy and friends, configured to
  pass the authorization header) forwards its own `Bearer <id_token>` on every
  request. `callerMiddleware` treated any bearer as an OVR credential, so Better
  Auth rejected the proxy's token and every route behind it — builds, snapshots,
  diffs, and the screenshots served by `storage.getObject` — returned
  `UNAUTHORIZED` for logged-in users. `apiKeyMiddleware` had the same flaw.

  Both now look at the bearer's prefix first: one that is not an OVR token is
  treated as if no bearer were sent, so `callerMiddleware` authenticates the
  session and `apiKeyMiddleware` still reports missing credentials. Validation of
  a bearer that does carry an OVR prefix is unchanged.

- Updated dependencies [[`270db0e`](https://github.com/open-visual-regression/open-visual-regression/commit/270db0e0d44f4b62716df326198c6366b71ee3b3)]:
  - @ovr/db@0.2.1
  - @ovr/builds@0.1.5
  - @ovr/git-status@0.1.3
  - @ovr/queue@0.1.3
  - @ovr/reviews@0.1.5

## 0.4.0

### Minor Changes

- [#186](https://github.com/open-visual-regression/open-visual-regression/pull/186) [`4d82876`](https://github.com/open-visual-regression/open-visual-regression/commit/4d828762aa9e5a8e49345d58f2276d18f3467127) Thanks [@tgfischer](https://github.com/tgfischer)! - Add a personal access token management page under user settings.

  Users can create and revoke `ovr_pat_...` tokens scoped to their own account
  rather than a project, for AI agents and other tools that need to read build
  results without a human relaying them. Unlike project API keys, personal
  access tokens carry the caller's own permissions and are rejected outright by
  any endpoint that requires a specific token type.

### Patch Changes

- Updated dependencies [[`4d82876`](https://github.com/open-visual-regression/open-visual-regression/commit/4d828762aa9e5a8e49345d58f2276d18f3467127), [`bf346a2`](https://github.com/open-visual-regression/open-visual-regression/commit/bf346a26490a2b02589f94ce714dd8ac54cebf94)]:
  - @ovr/api@0.2.0
  - @ovr/db@0.2.0
  - @ovr/ui@0.1.0
  - @ovr/reviews@0.1.4
  - @ovr/builds@0.1.4
  - @ovr/git-status@0.1.2
  - @ovr/queue@0.1.2

## 0.3.3

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
  - @ovr/api@0.1.1
  - @ovr/git-status@0.1.1
  - @ovr/queue@0.1.1
  - @ovr/reviews@0.1.3

## 0.3.2

### Patch Changes

- [#162](https://github.com/open-visual-regression/open-visual-regression/pull/162) [`9b914ca`](https://github.com/open-visual-regression/open-visual-regression/commit/9b914ca72526a09489160cabe6fd9c224173d300) Thanks [@tgfischer](https://github.com/tgfischer)! - Fit tall snapshots into the space left on screen instead of running them off the bottom of it.

  A snapshot taller than it is wide — a mobile viewport most of all — was rendered
  at the full width of its pane, which left it several screens tall with only a
  sliver of it visible in the split and slider views. From the `lg` breakpoint up,
  each pane now takes the height left below the page header and scales its
  snapshot to fit, anchored to the top left of the dotted backdrop so the panes
  line up with each other. The backdrop keeps the full width of its pane, and a
  narrower screen keeps the full width snapshot and scrolls.

- Updated dependencies []:
  - @ovr/ui@0.0.0

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
