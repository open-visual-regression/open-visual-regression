# @ovr/web

## 0.17.0

### Minor Changes

- [#454](https://github.com/open-visual-regression/open-visual-regression/pull/454) [`7a73f92`](https://github.com/open-visual-regression/open-visual-regression/commit/7a73f92fcdbd28af33cb9b8b0b96b3bc66f9be70) Thanks [@tgfischer](https://github.com/tgfischer)! - External hosts aren't blocked by default. Set `blockExternalRequests` in `ovr.config.ts` to block them, either all (`true`) or all but some (`{ allow: ["images.example.com"] }`), and override it for one story with `parameters.ovr.blockExternalRequests`. Stories that load images or fonts from another host may change once, since those now load.

### Patch Changes

- [#456](https://github.com/open-visual-regression/open-visual-regression/pull/456) [`3ecc66d`](https://github.com/open-visual-regression/open-visual-regression/commit/3ecc66d08cd328b884dfe15560d7ed8ef9f0c2da) Thanks [@tgfischer](https://github.com/tgfischer)! - Builds with many snapshots no longer wait behind a steady stream of smaller builds under the `round-robin` capture queue policy.

- Updated dependencies [[`7a73f92`](https://github.com/open-visual-regression/open-visual-regression/commit/7a73f92fcdbd28af33cb9b8b0b96b3bc66f9be70), [`3ecc66d`](https://github.com/open-visual-regression/open-visual-regression/commit/3ecc66d08cd328b884dfe15560d7ed8ef9f0c2da)]:
  - @ovr/api@0.5.2
  - @ovr/builds@0.2.10
  - @ovr/db@0.4.6
  - @ovr/queue@0.2.8
  - @ovr/ui@0.1.4
  - @ovr/reviews@0.1.25
  - @ovr/git-status@0.1.18

## 0.16.3

## 0.16.2

### Patch Changes

- Updated dependencies [[`1560be5`](https://github.com/open-visual-regression/open-visual-regression/commit/1560be58843ecd23b3c54c148451e8775cd6b26e)]:
  - @ovr/builds@0.2.9
  - @ovr/reviews@0.1.24

## 0.16.1

### Patch Changes

- Updated dependencies []:
  - @ovr/ui@0.1.4

## 0.16.0

### Minor Changes

- [#443](https://github.com/open-visual-regression/open-visual-regression/pull/443) [`9a652af`](https://github.com/open-visual-regression/open-visual-regression/commit/9a652af2fddab68a92a65dfb88359a9f1edfdc0b) Thanks [@tgfischer](https://github.com/tgfischer)! - Builds show how long they took to run, including time spent in the queue.

- [#445](https://github.com/open-visual-regression/open-visual-regression/pull/445) [`6b5a4d8`](https://github.com/open-visual-regression/open-visual-regression/commit/6b5a4d8f1e76ad4b351a99cfb0baaf604f00781a) Thanks [@tgfischer](https://github.com/tgfischer)! - Builds that have been superseded on their branch link to the latest build.

## 0.15.0

### Minor Changes

- [#441](https://github.com/open-visual-regression/open-visual-regression/pull/441) [`47af771`](https://github.com/open-visual-regression/open-visual-regression/commit/47af771b1e11fc4639f7947a3f1bb3b9d1b351f2) Thanks [@tgfischer](https://github.com/tgfischer)! - The web app and worker can serve metrics on builds, queues, snapshot captures, and worker health, so Prometheus, Grafana, Datadog, and other monitoring tools can track OVR without parsing its logs. Set `OVR_METRICS_PORT` (Helm: `metrics.enabled`) to turn them on. With the Prometheus Operator, the Helm chart can also create the scrape config, alerting rules, and a Grafana dashboard. See the Metrics page in the self-hosting docs.

### Patch Changes

- Updated dependencies [[`8bb7448`](https://github.com/open-visual-regression/open-visual-regression/commit/8bb74484257bc01831da1207be516dd01c3ad21c), [`79276f2`](https://github.com/open-visual-regression/open-visual-regression/commit/79276f236ad32d79fab0b5ad9494697490b2d562)]:
  - @ovr/queue@0.2.7
  - @ovr/builds@0.2.8
  - @ovr/db@0.4.5
  - @ovr/reviews@0.1.23
  - @ovr/git-status@0.1.17

## 0.14.5

### Patch Changes

- Updated dependencies []:
  - @ovr/ui@0.1.4

## 0.14.4

### Patch Changes

- [#429](https://github.com/open-visual-regression/open-visual-regression/pull/429) [`5c06f39`](https://github.com/open-visual-regression/open-visual-regression/commit/5c06f390a44b69f3aa0b8a7be22391528a45dfba) Thanks [@tgfischer](https://github.com/tgfischer)! - Docker images now run on Node.js 24.22.1, which includes the October 2026 Node.js security fixes.

- [#426](https://github.com/open-visual-regression/open-visual-regression/pull/426) [`c6930b4`](https://github.com/open-visual-regression/open-visual-regression/commit/c6930b404c01abf9b6a25cda64ce6a31c405edbd) Thanks [@tgfischer](https://github.com/tgfischer)! - Small builds no longer wait for every snapshot of a large build queued before them. Set `OVR_CAPTURE_QUEUE_POLICY=fifo` to keep the previous order.

- Updated dependencies [[`c6930b4`](https://github.com/open-visual-regression/open-visual-regression/commit/c6930b404c01abf9b6a25cda64ce6a31c405edbd)]:
  - @ovr/builds@0.2.7
  - @ovr/queue@0.2.6
  - @ovr/reviews@0.1.22

## 0.14.3

### Patch Changes

- [#423](https://github.com/open-visual-regression/open-visual-regression/pull/423) [`226ca93`](https://github.com/open-visual-regression/open-visual-regression/commit/226ca93ce845500ea939a199307dd28c2ceb5a99) Thanks [@tgfischer](https://github.com/tgfischer)! - Index the foreign keys that had no index on their referencing column, including `diffs.baseline_snapshot_id`. Without it, deleting a snapshot scanned every diff, which made the retention purge pin the database for hours. The upgrade builds the indexes without blocking the running app.

- Updated dependencies [[`26e384d`](https://github.com/open-visual-regression/open-visual-regression/commit/26e384dce69f59d73896bf27bb95860329bab761)]:
  - @ovr/builds@0.2.6
  - @ovr/db@0.4.4
  - @ovr/queue@0.2.5
  - @ovr/reviews@0.1.21
  - @ovr/git-status@0.1.16

## 0.14.2

### Patch Changes

- [#414](https://github.com/open-visual-regression/open-visual-regression/pull/414) [`7fe7872`](https://github.com/open-visual-regression/open-visual-regression/commit/7fe7872e285762435c62ffcc89856e0ff7c3af73) Thanks [@tgfischer](https://github.com/tgfischer)! - Long error messages on the snapshot page are now truncated to 4 lines, so they no longer push the snapshot far down the screen.

- [#415](https://github.com/open-visual-regression/open-visual-regression/pull/415) [`1784c87`](https://github.com/open-visual-regression/open-visual-regression/commit/1784c87b7a55ef8b685122595695f2584b4cf448) Thanks [@tgfischer](https://github.com/tgfischer)! - Pull request builds now show the same flaky snapshots as main-branch builds. `flags[].matchesEarlierVariant` is deprecated and always false.

- [#411](https://github.com/open-visual-regression/open-visual-regression/pull/411) [`8dfe727`](https://github.com/open-visual-regression/open-visual-regression/commit/8dfe727b5d3745703eaf38e5444ba084b40a68f1) Thanks [@tgfischer](https://github.com/tgfischer)! - Opening a snapshot from the snapshot history now shows the snapshot page skeleton instead of the build page skeleton.

- Updated dependencies [[`1784c87`](https://github.com/open-visual-regression/open-visual-regression/commit/1784c87b7a55ef8b685122595695f2584b4cf448), [`a269a15`](https://github.com/open-visual-regression/open-visual-regression/commit/a269a15f46915c5d027387a7f97583d8f0bc45ee)]:
  - @ovr/api@0.5.1
  - @ovr/db@0.4.3
  - @ovr/builds@0.2.5
  - @ovr/reviews@0.1.20
  - @ovr/git-status@0.1.15
  - @ovr/queue@0.2.4

## 0.14.1

### Patch Changes

- [#408](https://github.com/open-visual-regression/open-visual-regression/pull/408) [`773d6ac`](https://github.com/open-visual-regression/open-visual-regression/commit/773d6ac0ba4c391cfac5f2ee7e8684f3bc03d7a0) Thanks [@tgfischer](https://github.com/tgfischer)! - The snapshot History tab loads in one request and opens with the snapshot you're viewing centered, instead of flashing an empty message or shifting the list as newer builds arrive. History starts loading when you open the sidebar or hover the tab. `snapshots.getHistory` takes `align: "center"` to return the builds on both sides of the snapshot in its first page.

## 0.14.0

### Minor Changes

- [#401](https://github.com/open-visual-regression/open-visual-regression/pull/401) [`fd89747`](https://github.com/open-visual-regression/open-visual-regression/commit/fd897479d913a273fad01c5a8d8144288fb8c86a) Thanks [@tgfischer](https://github.com/tgfischer)! - Filter builds by commit on the builds page and the project page.

- [#403](https://github.com/open-visual-regression/open-visual-regression/pull/403) [`174cc13`](https://github.com/open-visual-regression/open-visual-regression/commit/174cc13e5d17b30efe95bc856a02ccb24519d070) Thanks [@tgfischer](https://github.com/tgfischer)! - `snapshots.getHistory` starts at the given snapshot, pages to older and newer builds with `nextCursor` and `previousCursor`, and includes each snapshot's image path and flags.

- [#405](https://github.com/open-visual-regression/open-visual-regression/pull/405) [`565920a`](https://github.com/open-visual-regression/open-visual-regression/commit/565920a6b7e0c9136d9a2cd9f3a450497d1bb63c) Thanks [@tgfischer](https://github.com/tgfischer)! - Add a History tab to the snapshot sidebar that shows the snapshot's screenshot in each main branch build, with its status and warnings. It opens at the snapshot you're viewing and loads more builds as you scroll. Click a screenshot to open that snapshot.

### Patch Changes

- [#402](https://github.com/open-visual-regression/open-visual-regression/pull/402) [`ba549ab`](https://github.com/open-visual-regression/open-visual-regression/commit/ba549abb4c13b42e7ef50ce9cb975e0ce89b1ac4) Thanks [@tgfischer](https://github.com/tgfischer)! - Speed up loading a snapshot's history, which scanned every snapshot on each page. The upgrade builds the new index without blocking the running app, and two migrators starting at once no longer deadlock on it.

- [#398](https://github.com/open-visual-regression/open-visual-regression/pull/398) [`d7d110a`](https://github.com/open-visual-regression/open-visual-regression/commit/d7d110a36ab0310cd663ac9be8432c658c2675c3) Thanks [@tgfischer](https://github.com/tgfischer)! - The reviews and activity panel on the snapshot page no longer shows a left border on mobile, where it takes up the full width.

- [#399](https://github.com/open-visual-regression/open-visual-regression/pull/399) [`c946060`](https://github.com/open-visual-regression/open-visual-regression/commit/c9460607190f859a7552ebb1f43cbb00d06b1b79) Thanks [@tgfischer](https://github.com/tgfischer)! - Keep the snapshot zoom toolbar on one line on mobile by hiding the 100% and fit buttons there, and drop the baseline commit from the zoom dialog since it already shows above the snapshot.

- Updated dependencies []:
  - @ovr/ui@0.1.4

## 0.13.0

### Minor Changes

- [#394](https://github.com/open-visual-regression/open-visual-regression/pull/394) [`2dfc905`](https://github.com/open-visual-regression/open-visual-regression/commit/2dfc905486a46e9ca878f1ddfa56b76b0c584e05) Thanks [@tgfischer](https://github.com/tgfischer)! - Click a snapshot to zoom in on it, and switch between the baseline and new snapshot in the zoom dialog to compare them. The new snapshot opens with the diff shown or hidden to match the split view.

### Patch Changes

- [#393](https://github.com/open-visual-regression/open-visual-regression/pull/393) [`bbef1f4`](https://github.com/open-visual-regression/open-visual-regression/commit/bbef1f4f2928cf45c079b139570f4fe9801e3ea5) Thanks [@tgfischer](https://github.com/tgfischer)! - The baseline and new snapshot now line up at the same scale in the slider and split views when they have different sizes.

- [#396](https://github.com/open-visual-regression/open-visual-regression/pull/396) [`1555f79`](https://github.com/open-visual-regression/open-visual-regression/commit/1555f7939d6a8e136b06ae88c31f1565b5d843d9) Thanks [@tgfischer](https://github.com/tgfischer)! - Opening a build from the sidebar now shows the build page skeleton instead of the project builds list skeleton.

## 0.12.0

### Minor Changes

- [#389](https://github.com/open-visual-regression/open-visual-regression/pull/389) [`8e45f3a`](https://github.com/open-visual-regression/open-visual-regression/commit/8e45f3a709ea77e73beaad2fc96a1b1dcf407960) Thanks [@tgfischer](https://github.com/tgfischer)! - Add `processingMs` to the snapshots in `snapshots.list`, and show it on snapshot cards in a build, next to the browser and viewport.

- [#387](https://github.com/open-visual-regression/open-visual-regression/pull/387) [`cc7d7e1`](https://github.com/open-visual-regression/open-visual-regression/commit/cc7d7e149a4fffec1c5852febce0111b6225d7cc) Thanks [@tgfischer](https://github.com/tgfischer)! - The snapshot page shows how long a snapshot took to process, next to its browser and viewport. The time appears once processing has finished. Snapshots captured before this release show no time.

- [#383](https://github.com/open-visual-regression/open-visual-regression/pull/383) [`cb2a6e7`](https://github.com/open-visual-regression/open-visual-regression/commit/cb2a6e71cf356993afc3ff576632a66282916d22) Thanks [@tgfischer](https://github.com/tgfischer)! - OVR can sign people in from the identity an SSO proxy forwards, so deployments behind Okta or another identity provider no longer ask for a second password. Set `OVR_AUTH_MODE=trusted-proxy` (Helm: `auth.mode`) to turn it on. Existing users keep their accounts, matched by email. Roles come from the identity provider's groups and update on every request. See the SSO page in the self-hosting docs.

### Patch Changes

- [#391](https://github.com/open-visual-regression/open-visual-regression/pull/391) [`9abd039`](https://github.com/open-visual-regression/open-visual-regression/commit/9abd0397d51a44ee26bd98bccca762a3f47b874e) Thanks [@tgfischer](https://github.com/tgfischer)! - Approving or rejecting a snapshot now moves on to the next one immediately instead of waiting for the vote to save.

- Updated dependencies [[`8e45f3a`](https://github.com/open-visual-regression/open-visual-regression/commit/8e45f3a709ea77e73beaad2fc96a1b1dcf407960)]:
  - @ovr/api@0.5.0
  - @ovr/builds@0.2.4
  - @ovr/reviews@0.1.19

## 0.11.2

### Patch Changes

- Updated dependencies [[`6f32f54`](https://github.com/open-visual-regression/open-visual-regression/commit/6f32f54c5d60542e3c25fbdc6f6feb98a26373d9), [`ecf4162`](https://github.com/open-visual-regression/open-visual-regression/commit/ecf41625621ccb55b5953932a21058264af44c08)]:
  - @ovr/db@0.4.2
  - @ovr/builds@0.2.3
  - @ovr/git-status@0.1.14
  - @ovr/queue@0.2.3
  - @ovr/reviews@0.1.18

## 0.11.1

### Patch Changes

- Updated dependencies [[`0d851dc`](https://github.com/open-visual-regression/open-visual-regression/commit/0d851dc7ef40b62a768fde90552fc8bfec95b58f), [`f9be809`](https://github.com/open-visual-regression/open-visual-regression/commit/f9be809548dc835fcaf9b9b1ac9c8964fe1c50cd)]:
  - @ovr/db@0.4.1
  - @ovr/builds@0.2.2
  - @ovr/git-status@0.1.13
  - @ovr/queue@0.2.2
  - @ovr/reviews@0.1.17

## 0.11.0

### Minor Changes

- [#338](https://github.com/open-visual-regression/open-visual-regression/pull/338) [`8f8c3fb`](https://github.com/open-visual-regression/open-visual-regression/commit/8f8c3fb945d6f91412f59d578b9bddf50a894048) Thanks [@tgfischer](https://github.com/tgfischer)! - API responses include the server's version in the `x-ovr-version` header, and the CLI says when a command needs a newer server.

- [#336](https://github.com/open-visual-regression/open-visual-regression/pull/336) [`23dce06`](https://github.com/open-visual-regression/open-visual-regression/commit/23dce063717c0cbb8b78a6b8ee7048287057848c) Thanks [@tgfischer](https://github.com/tgfischer)! - Add `flags` to snapshot responses: flag names in `snapshots.list`, and each flag with its details in `snapshots.getOne`. `isFlaky` and `hasUncaughtPageError` are deprecated.

- [#339](https://github.com/open-visual-regression/open-visual-regression/pull/339) [`dd78378`](https://github.com/open-visual-regression/open-visual-regression/commit/dd78378a08d5225a897ba1c8124bc0f8252f913b) Thanks [@tgfischer](https://github.com/tgfischer)! - Add `ovr snapshots history` to show a snapshot's screenshot across recent builds.

### Patch Changes

- [#333](https://github.com/open-visual-regression/open-visual-regression/pull/333) [`3c29cec`](https://github.com/open-visual-regression/open-visual-regression/commit/3c29cec506066fe5a7187a9dc2317679b813eb10) Thanks [@tgfischer](https://github.com/tgfischer)! - Show when flaky detection is next scheduled to run on the jobs settings page.

- [#312](https://github.com/open-visual-regression/open-visual-regression/pull/312) [`1693f5d`](https://github.com/open-visual-regression/open-visual-regression/commit/1693f5dd5ee5bb38488cfcbd7df79892bf31d64a) Thanks [@tgfischer](https://github.com/tgfischer)! - Fix pages endlessly prefetching links in the background while they are open.

- [#313](https://github.com/open-visual-regression/open-visual-regression/pull/313) [`98552ff`](https://github.com/open-visual-regression/open-visual-regression/commit/98552ff84d5c2cd19e77584c352996af7e14567d) Thanks [@tgfischer](https://github.com/tgfischer)! - Show a project's updated name and details in the navigation right after saving its settings.

- Updated dependencies [[`8f8c3fb`](https://github.com/open-visual-regression/open-visual-regression/commit/8f8c3fb945d6f91412f59d578b9bddf50a894048), [`23dce06`](https://github.com/open-visual-regression/open-visual-regression/commit/23dce063717c0cbb8b78a6b8ee7048287057848c), [`dd78378`](https://github.com/open-visual-regression/open-visual-regression/commit/dd78378a08d5225a897ba1c8124bc0f8252f913b)]:
  - @ovr/api@0.4.0
  - @ovr/db@0.4.0
  - @ovr/ui@0.1.4
  - @ovr/builds@0.2.1
  - @ovr/reviews@0.1.16
  - @ovr/git-status@0.1.12
  - @ovr/queue@0.2.1

## 0.10.0

### Minor Changes

- [#307](https://github.com/open-visual-regression/open-visual-regression/pull/307) [`1a46b57`](https://github.com/open-visual-regression/open-visual-regression/commit/1a46b5760e151026056a0f7b5162b8991e97806c) Thanks [@tgfischer](https://github.com/tgfischer)! - Show when flaky detection last ran and add a "run now" button to the jobs page. Running saves any unsaved changes first, so it runs with the settings on screen. The button is disabled with a spinner while a run is in progress, and the page refreshes until the run finishes. Starting a run is refused when flaky detection is disabled or already running.

### Patch Changes

- Updated dependencies [[`1a46b57`](https://github.com/open-visual-regression/open-visual-regression/commit/1a46b5760e151026056a0f7b5162b8991e97806c)]:
  - @ovr/api@0.3.0
  - @ovr/builds@0.2.0
  - @ovr/db@0.3.0
  - @ovr/queue@0.2.0
  - @ovr/ui@0.1.4
  - @ovr/reviews@0.1.15
  - @ovr/git-status@0.1.11

## 0.9.4

### Patch Changes

- [#303](https://github.com/open-visual-regression/open-visual-regression/pull/303) [`f059de4`](https://github.com/open-visual-regression/open-visual-regression/commit/f059de4dd22306ed975024b2680bd1d25d6fcfaa) Thanks [@tgfischer](https://github.com/tgfischer)! - Let admins read and update flaky detection settings through the API. Saving reschedules the flaky snapshot dispatch, so a new schedule applies without restarting the worker.

- [#304](https://github.com/open-visual-regression/open-visual-regression/pull/304) [`8eb78b5`](https://github.com/open-visual-regression/open-visual-regression/commit/8eb78b5d41a752f9e544adf3c2d975ec518de2fa) Thanks [@tgfischer](https://github.com/tgfischer)! - Add a jobs page to the admin settings where flaky detection can be turned on, scheduled and tuned.

- [#295](https://github.com/open-visual-regression/open-visual-regression/pull/295) [`756a5b3`](https://github.com/open-visual-regression/open-visual-regression/commit/756a5b38e9fee5c07525daf34227cca2c934842f) Thanks [@tgfischer](https://github.com/tgfischer)! - Accept a `flags` filter on `snapshots.list` and `snapshots.getAdjacent`, and list the flags present in a build with `snapshots.listFlags`.

- [#296](https://github.com/open-visual-regression/open-visual-regression/pull/296) [`a24ad49`](https://github.com/open-visual-regression/open-visual-regression/commit/a24ad4986e4c12df320bb6e4df3d448e62318e25) Thanks [@tgfischer](https://github.com/tgfischer)! - Filter a build's snapshots to flaky ones or ones with warnings from a new flags filter.

- Updated dependencies [[`f059de4`](https://github.com/open-visual-regression/open-visual-regression/commit/f059de4dd22306ed975024b2680bd1d25d6fcfaa), [`c1f0578`](https://github.com/open-visual-regression/open-visual-regression/commit/c1f0578966bd70195900367943cc9db9511b2789), [`990c406`](https://github.com/open-visual-regression/open-visual-regression/commit/990c406d9b44c6c258fcc84b05d97497381306fe), [`8eb78b5`](https://github.com/open-visual-regression/open-visual-regression/commit/8eb78b5d41a752f9e544adf3c2d975ec518de2fa), [`839acca`](https://github.com/open-visual-regression/open-visual-regression/commit/839accaa17ba3e735f64cc62fdad9665a1e5d48c), [`756a5b3`](https://github.com/open-visual-regression/open-visual-regression/commit/756a5b38e9fee5c07525daf34227cca2c934842f), [`43e1f76`](https://github.com/open-visual-regression/open-visual-regression/commit/43e1f763904fd2d3b7f807205faad089a8db9db9)]:
  - @ovr/api@0.2.6
  - @ovr/builds@0.1.14
  - @ovr/queue@0.1.11
  - @ovr/db@0.2.8
  - @ovr/ui@0.1.3
  - @ovr/reviews@0.1.14
  - @ovr/git-status@0.1.10

## 0.9.3

### Patch Changes

- [#290](https://github.com/open-visual-regression/open-visual-regression/pull/290) [`925dfb7`](https://github.com/open-visual-regression/open-visual-regression/commit/925dfb762442ab2fc021edf33bfdd087a2246785) Thanks [@tgfischer](https://github.com/tgfischer)! - Mark a feature-branch snapshot as flaky when its change matches a look the story already had on main.

- [#289](https://github.com/open-visual-regression/open-visual-regression/pull/289) [`1550283`](https://github.com/open-visual-regression/open-visual-regression/commit/1550283a9514748c485b49f8084004d1d598b9d6) Thanks [@tgfischer](https://github.com/tgfischer)! - Show a flaky badge on snapshots of flaky stories.

- [#288](https://github.com/open-visual-regression/open-visual-regression/pull/288) [`1651aaf`](https://github.com/open-visual-regression/open-visual-regression/commit/1651aaf99b25db20472c486080bbc87b0b13588e) Thanks [@tgfischer](https://github.com/tgfischer)! - Report whether each snapshot is flaky.

- Updated dependencies [[`925dfb7`](https://github.com/open-visual-regression/open-visual-regression/commit/925dfb762442ab2fc021edf33bfdd087a2246785), [`1550283`](https://github.com/open-visual-regression/open-visual-regression/commit/1550283a9514748c485b49f8084004d1d598b9d6), [`2188523`](https://github.com/open-visual-regression/open-visual-regression/commit/21885235b03d37d3bb2c8cca94cecf7d570cbd91), [`1651aaf`](https://github.com/open-visual-regression/open-visual-regression/commit/1651aaf99b25db20472c486080bbc87b0b13588e), [`f5744e5`](https://github.com/open-visual-regression/open-visual-regression/commit/f5744e59bd6663553adf517b4efc5ee985ad32bb), [`85ebeca`](https://github.com/open-visual-regression/open-visual-regression/commit/85ebeca9697afe1ce475cb4b25d8012efa70409c), [`4c3d8c6`](https://github.com/open-visual-regression/open-visual-regression/commit/4c3d8c6b7143869b1f8d7ece13feaa1acae558ad), [`65c8f48`](https://github.com/open-visual-regression/open-visual-regression/commit/65c8f4824fe4cf4642fd3ad8b261d30ded2a6a68)]:
  - @ovr/db@0.2.7
  - @ovr/ui@0.1.2
  - @ovr/queue@0.1.10
  - @ovr/builds@0.1.13
  - @ovr/api@0.2.5
  - @ovr/git-status@0.1.9
  - @ovr/reviews@0.1.13

## 0.9.2

### Patch Changes

- [#281](https://github.com/open-visual-regression/open-visual-regression/pull/281) [`e78e057`](https://github.com/open-visual-regression/open-visual-regression/commit/e78e057c045bdbbff81939d6508a558823579c9a) Thanks [@tgfischer](https://github.com/tgfischer)! - Enforce review rules on the server instead of only hiding buttons. Voting on a snapshot is refused once a newer build has landed on the branch or the snapshot failed, and approving or rejecting a whole build is also refused while it is running, canceled, or errored. Build and snapshot details now expose `isReviewable` so the UI shows the review buttons only when a vote would be accepted.

- Updated dependencies [[`e78e057`](https://github.com/open-visual-regression/open-visual-regression/commit/e78e057c045bdbbff81939d6508a558823579c9a)]:
  - @ovr/api@0.2.4
  - @ovr/builds@0.1.12
  - @ovr/reviews@0.1.12

## 0.9.1

### Patch Changes

- [#278](https://github.com/open-visual-regression/open-visual-regression/pull/278) [`d920581`](https://github.com/open-visual-regression/open-visual-regression/commit/d920581f468ad7a21f7a8596bc964625096528e0) Thanks [@tgfischer](https://github.com/tgfischer)! - The login page no longer queries the database on every visit once setup is complete, and signed-in sessions are re-checked against the database every 5 minutes instead of every minute. Idle deployments on scale-to-zero databases stay asleep longer.

## 0.9.0

### Minor Changes

- [#276](https://github.com/open-visual-regression/open-visual-regression/pull/276) [`5cd6588`](https://github.com/open-visual-regression/open-visual-regression/commit/5cd658814ea10a6d55fdfa273458b306858d9964) Thanks [@tgfischer](https://github.com/tgfischer)! - Add a zoom button to each snapshot on the snapshot page. It opens the image full screen, where you can zoom, pan and reset to fit or 100%. The diff overlay stays in place and can be toggled without losing your position. The diff toggle now sits in the new snapshot's header.

## 0.8.0

### Minor Changes

- [#268](https://github.com/open-visual-regression/open-visual-regression/pull/268) [`8f7e318`](https://github.com/open-visual-regression/open-visual-regression/commit/8f7e318ce56656f36cc206fa58341652c7662080) Thanks [@tgfischer](https://github.com/tgfischer)! - Add a "disable" button to a project's git integration that stops it from updating CI checks, with a matching "enable" button to turn it back on. Commit and branch links keep working while it's disabled.

### Patch Changes

- [#270](https://github.com/open-visual-regression/open-visual-regression/pull/270) [`8d521a4`](https://github.com/open-visual-regression/open-visual-regression/commit/8d521a4e94f47700f8ed5123accfabd248392c8c) Thanks [@tgfischer](https://github.com/tgfischer)! - Retrying `ovr upload` after a network error no longer creates a duplicate build that cancels the first one.

- [#269](https://github.com/open-visual-regression/open-visual-regression/pull/269) [`c4b462c`](https://github.com/open-visual-regression/open-visual-regression/commit/c4b462c7faeae38b34d440c17d15afcc7fe39ebb) Thanks [@tgfischer](https://github.com/tgfischer)! - When the build queue can't be reached, uploads now fail within seconds and the build is marked as failed with the reason, instead of hanging and staying queued.

- [#274](https://github.com/open-visual-regression/open-visual-regression/pull/274) [`7d343ab`](https://github.com/open-visual-regression/open-visual-regression/commit/7d343ab479b8c49c71237d1edaa70b88862b49ba) Thanks [@tgfischer](https://github.com/tgfischer)! - Finished queue jobs are now removed from Redis after an hour (failed ones after a week), instead of being kept forever and eventually exhausting Redis memory.

- Updated dependencies []:
  - @ovr/ui@0.1.1

## 0.7.0

### Minor Changes

- [#266](https://github.com/open-visual-regression/open-visual-regression/pull/266) [`562186d`](https://github.com/open-visual-regression/open-visual-regression/commit/562186d5828bac42e2f0068b4f3750beb016f0a5) Thanks [@tgfischer](https://github.com/tgfischer)! - Add a `waitForTimeout` option to wait a fixed number of milliseconds before a story's screenshot is taken, for stories whose data or images take a while to load. Set it for every story in `ovr.config.ts`, or for one story with `parameters.ovr.waitForTimeout`. Defaults to `0`, at most `30000`.

### Patch Changes

- Updated dependencies []:
  - @ovr/ui@0.1.1

## 0.6.4

### Patch Changes

- Updated dependencies [[`01010bd`](https://github.com/open-visual-regression/open-visual-regression/commit/01010bdea54b07eda9bb4b2b131abd1055ee82a1), [`4ecd06f`](https://github.com/open-visual-regression/open-visual-regression/commit/4ecd06f3927efe6b17865e6d877e7f5692164238)]:
  - @ovr/builds@0.1.11
  - @ovr/queue@0.1.9
  - @ovr/db@0.2.6
  - @ovr/reviews@0.1.11
  - @ovr/git-status@0.1.8

## 0.6.3

### Patch Changes

- [#249](https://github.com/open-visual-regression/open-visual-regression/pull/249) [`73f7fda`](https://github.com/open-visual-regression/open-visual-regression/commit/73f7fda61041627356c9ad7a183efb4007f47ac0) Thanks [@tgfischer](https://github.com/tgfischer)! - Add an endpoint that returns a project's baseline build: the latest successful build on its main branch.

- [#248](https://github.com/open-visual-regression/open-visual-regression/pull/248) [`020759a`](https://github.com/open-visual-regression/open-visual-regression/commit/020759aceccb7baaa47641a9527b5a73b0af3275) Thanks [@tgfischer](https://github.com/tgfischer)! - Show the test connection and disconnect actions right after saving a git integration, and hide them after disconnecting, without reloading the page.

- [#253](https://github.com/open-visual-regression/open-visual-regression/pull/253) [`6f929cc`](https://github.com/open-visual-regression/open-visual-regression/commit/6f929cc8f4803bcafc678d21da5c63fad0e40b29) Thanks [@tgfischer](https://github.com/tgfischer)! - Return to the page you opened after signing in.

- [#257](https://github.com/open-visual-regression/open-visual-regression/pull/257) [`4177ca9`](https://github.com/open-visual-regression/open-visual-regression/commit/4177ca9e0503839b9c40b34041ef9e981076edf4) Thanks [@tgfischer](https://github.com/tgfischer)! - Show a warning badge on snapshot cards when the story rendered with an uncaught error.

- [#252](https://github.com/open-visual-regression/open-visual-regression/pull/252) [`9e51c55`](https://github.com/open-visual-regression/open-visual-regression/commit/9e51c5526547457dd7519d79d7854fa99ee773ed) Thanks [@tgfischer](https://github.com/tgfischer)! - Add stable links to a project's baseline build and baseline Storybook.

- [#251](https://github.com/open-visual-regression/open-visual-regression/pull/251) [`12bbb1e`](https://github.com/open-visual-regression/open-visual-regression/commit/12bbb1ee61ebf33b75e1a0741b871ae144376eaf) Thanks [@tgfischer](https://github.com/tgfischer)! - Add a "view baseline" button to the project builds page.

- Updated dependencies [[`73f7fda`](https://github.com/open-visual-regression/open-visual-regression/commit/73f7fda61041627356c9ad7a183efb4007f47ac0), [`4177ca9`](https://github.com/open-visual-regression/open-visual-regression/commit/4177ca9e0503839b9c40b34041ef9e981076edf4), [`9e51c55`](https://github.com/open-visual-regression/open-visual-regression/commit/9e51c5526547457dd7519d79d7854fa99ee773ed), [`12bbb1e`](https://github.com/open-visual-regression/open-visual-regression/commit/12bbb1ee61ebf33b75e1a0741b871ae144376eaf)]:
  - @ovr/api@0.2.3
  - @ovr/builds@0.1.10
  - @ovr/db@0.2.5
  - @ovr/ui@0.1.1
  - @ovr/reviews@0.1.10
  - @ovr/git-status@0.1.7
  - @ovr/queue@0.1.8

## 0.6.2

### Patch Changes

- [#246](https://github.com/open-visual-regression/open-visual-regression/pull/246) [`e2ae5d8`](https://github.com/open-visual-regression/open-visual-regression/commit/e2ae5d884253dffbd996b4bbd946b6b9d4778cc6) Thanks [@tgfischer](https://github.com/tgfischer)! - Restore the close button on the mobile navigation sheet, on its own row above the sidebar links so it no longer overlaps the projects heading link.

- [#242](https://github.com/open-visual-regression/open-visual-regression/pull/242) [`aff53e1`](https://github.com/open-visual-regression/open-visual-regression/commit/aff53e1caa0235dd8c7283d0f8c6eef7cc2352a3) Thanks [@tgfischer](https://github.com/tgfischer)! - Add `upload storybook --only-affected` to capture only the stories a change can affect.

- [#241](https://github.com/open-visual-regression/open-visual-regression/pull/241) [`16d2294`](https://github.com/open-visual-regression/open-visual-regression/commit/16d22944b317faf70e5b54f256231c4f73816aee) Thanks [@tgfischer](https://github.com/tgfischer)! - Let an upload skip targets its changes can't affect. Skipped targets keep their baselines.

- Updated dependencies [[`aff53e1`](https://github.com/open-visual-regression/open-visual-regression/commit/aff53e1caa0235dd8c7283d0f8c6eef7cc2352a3), [`16d2294`](https://github.com/open-visual-regression/open-visual-regression/commit/16d22944b317faf70e5b54f256231c4f73816aee)]:
  - @ovr/api@0.2.2
  - @ovr/builds@0.1.9
  - @ovr/db@0.2.4
  - @ovr/queue@0.1.7
  - @ovr/ui@0.1.0
  - @ovr/reviews@0.1.9
  - @ovr/git-status@0.1.6

## 0.6.1

### Patch Changes

- Updated dependencies [[`9edbf39`](https://github.com/open-visual-regression/open-visual-regression/commit/9edbf39d9dc6b56d1529668611c54d557067bbe8)]:
  - @ovr/db@0.2.3
  - @ovr/builds@0.1.8
  - @ovr/git-status@0.1.5
  - @ovr/queue@0.1.6
  - @ovr/reviews@0.1.8

## 0.6.0

### Patch Changes

- [#233](https://github.com/open-visual-regression/open-visual-regression/pull/233) [`7237920`](https://github.com/open-visual-regression/open-visual-regression/commit/72379203107e43351fbcc25628fccd0d1295bde7) Thanks [@tgfischer](https://github.com/tgfischer)! - Support Redis Cluster. Set `REDIS_MODE=cluster`, or `redis.mode: cluster` in the Helm chart.

- Updated dependencies [[`7237920`](https://github.com/open-visual-regression/open-visual-regression/commit/72379203107e43351fbcc25628fccd0d1295bde7)]:
  - @ovr/queue@0.1.5
  - @ovr/builds@0.1.7
  - @ovr/reviews@0.1.7

## 0.5.4

### Patch Changes

- [#230](https://github.com/open-visual-regression/open-visual-regression/pull/230) [`aa1d4ee`](https://github.com/open-visual-regression/open-visual-regression/commit/aa1d4eeeba1989b5cd4470dd8a4c80a98bbc056b) Thanks [@tgfischer](https://github.com/tgfischer)! - The sidebar no longer shows the builds page's loading skeleton, stays in place when moving between projects and builds, and no longer holds up navigation while it loads.

## 0.5.3

### Patch Changes

- [#228](https://github.com/open-visual-regression/open-visual-regression/pull/228) [`0c2eb33`](https://github.com/open-visual-regression/open-visual-regression/commit/0c2eb33694fd316b8004d6a4ca7706379d2ebc0e) Thanks [@tgfischer](https://github.com/tgfischer)! - Fix the sidebar sometimes showing the main content's loading skeleton instead of its own.

## 0.5.2

### Patch Changes

- [#225](https://github.com/open-visual-regression/open-visual-regression/pull/225) [`36a6db1`](https://github.com/open-visual-regression/open-visual-regression/commit/36a6db1153c53e1abb0b929fcf2ca71706c6da74) Thanks [@tgfischer](https://github.com/tgfischer)! - Add a rebuild button to the snapshot page.

  A reviewer can re-capture a single snapshot without rebuilding the whole
  build. The confirmation spells out that the screenshot, logs, diff and any
  review on it are replaced, and the button also shows for an errored
  snapshot, which has nothing to review.

- [#224](https://github.com/open-visual-regression/open-visual-regression/pull/224) [`c07442d`](https://github.com/open-visual-regression/open-visual-regression/commit/c07442d355afa70ef5a81e9b35936ac5b9e3347f) Thanks [@tgfischer](https://github.com/tgfischer)! - Expose `snapshots.rebuild`, which re-captures the given snapshots of a build.

  Reviewers and admins can rebuild up to 100 snapshots of a build at a time.
  `snapshots.getOne` now reports `isRebuildable` so a caller can tell whether a
  snapshot can be rebuilt before asking.

- Updated dependencies [[`2273afc`](https://github.com/open-visual-regression/open-visual-regression/commit/2273afc3e92f607a538bb5ca7c7f931495b476d1), [`c07442d`](https://github.com/open-visual-regression/open-visual-regression/commit/c07442d355afa70ef5a81e9b35936ac5b9e3347f), [`9ba80f1`](https://github.com/open-visual-regression/open-visual-regression/commit/9ba80f10bf007bd5741f58ca1c5282f88b4e92b6), [`2273afc`](https://github.com/open-visual-regression/open-visual-regression/commit/2273afc3e92f607a538bb5ca7c7f931495b476d1)]:
  - @ovr/queue@0.1.4
  - @ovr/api@0.2.1
  - @ovr/builds@0.1.6
  - @ovr/db@0.2.2
  - @ovr/reviews@0.1.6
  - @ovr/git-status@0.1.4

## 0.5.1

### Patch Changes

- [#220](https://github.com/open-visual-regression/open-visual-regression/pull/220) [`0a18f34`](https://github.com/open-visual-regression/open-visual-regression/commit/0a18f345eaf12488e8d1e8875447e6f05bc01439) Thanks [@tgfischer](https://github.com/tgfischer)! - Fix the builds/projects sidebar showing the main content's loading skeleton instead of its own.

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
