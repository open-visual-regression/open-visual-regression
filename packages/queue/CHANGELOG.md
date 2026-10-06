# @ovr/queue

## 0.2.0

### Minor Changes

- [#307](https://github.com/open-visual-regression/open-visual-regression/pull/307) [`1a46b57`](https://github.com/open-visual-regression/open-visual-regression/commit/1a46b5760e151026056a0f7b5162b8991e97806c) Thanks [@tgfischer](https://github.com/tgfischer)! - Show when flaky detection last ran and add a "run now" button to the jobs page. Running saves any unsaved changes first, so it runs with the settings on screen. The button is disabled with a spinner while a run is in progress, and the page refreshes until the run finishes. Starting a run is refused when flaky detection is disabled or already running.

### Patch Changes

- Updated dependencies [[`1a46b57`](https://github.com/open-visual-regression/open-visual-regression/commit/1a46b5760e151026056a0f7b5162b8991e97806c)]:
  - @ovr/db@0.3.0

## 0.1.11

### Patch Changes

- [#303](https://github.com/open-visual-regression/open-visual-regression/pull/303) [`f059de4`](https://github.com/open-visual-regression/open-visual-regression/commit/f059de4dd22306ed975024b2680bd1d25d6fcfaa) Thanks [@tgfischer](https://github.com/tgfischer)! - Let admins read and update flaky detection settings through the API. Saving reschedules the flaky snapshot dispatch, so a new schedule applies without restarting the worker.

- [#301](https://github.com/open-visual-regression/open-visual-regression/pull/301) [`990c406`](https://github.com/open-visual-regression/open-visual-regression/commit/990c406d9b44c6c258fcc84b05d97497381306fe) Thanks [@tgfischer](https://github.com/tgfischer)! - Share the flaky detection settings schema and its defaults between the worker and the API. `cronPatternSchema` moves from `@ovr/queue` to `@ovr/api/contracts/jobs`.

- [#302](https://github.com/open-visual-regression/open-visual-regression/pull/302) [`839acca`](https://github.com/open-visual-regression/open-visual-regression/commit/839accaa17ba3e735f64cc62fdad9665a1e5d48c) Thanks [@tgfischer](https://github.com/tgfischer)! - Read flaky detection settings (on or off, schedule, and how many recent builds to consider) from the database instead of the `OVR_FLAKY_DETECTION_*` environment variables, which are removed along with `worker.flakyDetection` in the Helm chart. Remove `worker.flakyDetection` from your Helm values before upgrading; the chart's schema now rejects it.

- Updated dependencies [[`c1f0578`](https://github.com/open-visual-regression/open-visual-regression/commit/c1f0578966bd70195900367943cc9db9511b2789), [`43e1f76`](https://github.com/open-visual-regression/open-visual-regression/commit/43e1f763904fd2d3b7f807205faad089a8db9db9)]:
  - @ovr/db@0.2.8

## 0.1.10

### Patch Changes

- [#287](https://github.com/open-visual-regression/open-visual-regression/pull/287) [`2188523`](https://github.com/open-visual-regression/open-visual-regression/commit/21885235b03d37d3bb2c8cca94cecf7d570cbd91) Thanks [@tgfischer](https://github.com/tgfischer)! - Check stories for flakiness on a schedule. Turn it on with `OVR_FLAKY_DETECTION_ENABLED`, or `worker.flakyDetection.enabled` in the Helm chart, and set how often it runs with `OVR_FLAKY_DETECTION_CRON`.

- Updated dependencies [[`925dfb7`](https://github.com/open-visual-regression/open-visual-regression/commit/925dfb762442ab2fc021edf33bfdd087a2246785), [`2188523`](https://github.com/open-visual-regression/open-visual-regression/commit/21885235b03d37d3bb2c8cca94cecf7d570cbd91), [`1651aaf`](https://github.com/open-visual-regression/open-visual-regression/commit/1651aaf99b25db20472c486080bbc87b0b13588e), [`f5744e5`](https://github.com/open-visual-regression/open-visual-regression/commit/f5744e59bd6663553adf517b4efc5ee985ad32bb), [`85ebeca`](https://github.com/open-visual-regression/open-visual-regression/commit/85ebeca9697afe1ce475cb4b25d8012efa70409c), [`4c3d8c6`](https://github.com/open-visual-regression/open-visual-regression/commit/4c3d8c6b7143869b1f8d7ece13feaa1acae558ad), [`65c8f48`](https://github.com/open-visual-regression/open-visual-regression/commit/65c8f4824fe4cf4642fd3ad8b261d30ded2a6a68)]:
  - @ovr/db@0.2.7

## 0.1.9

### Patch Changes

- [#263](https://github.com/open-visual-regression/open-visual-regression/pull/263) [`01010bd`](https://github.com/open-visual-regression/open-visual-regression/commit/01010bdea54b07eda9bb4b2b131abd1055ee82a1) Thanks [@tgfischer](https://github.com/tgfischer)! - Fix a build staying in processing when it needed to finalize again after an earlier finalize had already run.

- Updated dependencies [[`4ecd06f`](https://github.com/open-visual-regression/open-visual-regression/commit/4ecd06f3927efe6b17865e6d877e7f5692164238)]:
  - @ovr/db@0.2.6

## 0.1.8

### Patch Changes

- Updated dependencies [[`4177ca9`](https://github.com/open-visual-regression/open-visual-regression/commit/4177ca9e0503839b9c40b34041ef9e981076edf4)]:
  - @ovr/db@0.2.5

## 0.1.7

### Patch Changes

- [#241](https://github.com/open-visual-regression/open-visual-regression/pull/241) [`16d2294`](https://github.com/open-visual-regression/open-visual-regression/commit/16d22944b317faf70e5b54f256231c4f73816aee) Thanks [@tgfischer](https://github.com/tgfischer)! - Let an upload skip targets its changes can't affect. Skipped targets keep their baselines.

- Updated dependencies [[`16d2294`](https://github.com/open-visual-regression/open-visual-regression/commit/16d22944b317faf70e5b54f256231c4f73816aee)]:
  - @ovr/db@0.2.4

## 0.1.6

### Patch Changes

- Updated dependencies [[`9edbf39`](https://github.com/open-visual-regression/open-visual-regression/commit/9edbf39d9dc6b56d1529668611c54d557067bbe8)]:
  - @ovr/db@0.2.3

## 0.1.5

### Patch Changes

- [#233](https://github.com/open-visual-regression/open-visual-regression/pull/233) [`7237920`](https://github.com/open-visual-regression/open-visual-regression/commit/72379203107e43351fbcc25628fccd0d1295bde7) Thanks [@tgfischer](https://github.com/tgfischer)! - Support Redis Cluster. Set `REDIS_MODE=cluster`, or `redis.mode: cluster` in the Helm chart.

## 0.1.4

### Patch Changes

- [#222](https://github.com/open-visual-regression/open-visual-regression/pull/222) [`2273afc`](https://github.com/open-visual-regression/open-visual-regression/commit/2273afc3e92f607a538bb5ca7c7f931495b476d1) Thanks [@tgfischer](https://github.com/tgfischer)! - Add `clearFinalizeJob`, which drops the finalize job a build has already
  completed.

  Finalize jobs are keyed by build id and BullMQ keeps completed jobs, so
  enqueuing a second finalize for the same build is silently dropped. Clearing the
  job first lets a build that has more work to do finalize again.

- Updated dependencies [[`9ba80f1`](https://github.com/open-visual-regression/open-visual-regression/commit/9ba80f10bf007bd5741f58ca1c5282f88b4e92b6), [`2273afc`](https://github.com/open-visual-regression/open-visual-regression/commit/2273afc3e92f607a538bb5ca7c7f931495b476d1)]:
  - @ovr/db@0.2.2

## 0.1.3

### Patch Changes

- Updated dependencies [[`270db0e`](https://github.com/open-visual-regression/open-visual-regression/commit/270db0e0d44f4b62716df326198c6366b71ee3b3)]:
  - @ovr/db@0.2.1

## 0.1.2

### Patch Changes

- Updated dependencies [[`4d82876`](https://github.com/open-visual-regression/open-visual-regression/commit/4d828762aa9e5a8e49345d58f2276d18f3467127), [`bf346a2`](https://github.com/open-visual-regression/open-visual-regression/commit/bf346a26490a2b02589f94ce714dd8ac54cebf94)]:
  - @ovr/db@0.2.0

## 0.1.1

### Patch Changes

- Updated dependencies [[`37027a0`](https://github.com/open-visual-regression/open-visual-regression/commit/37027a0d7d3df3b87d11a7e47bedac2498838f39), [`dff0593`](https://github.com/open-visual-regression/open-visual-regression/commit/dff059342ca035643a693fb6a459a3d948a451ee)]:
  - @ovr/db@0.1.1
