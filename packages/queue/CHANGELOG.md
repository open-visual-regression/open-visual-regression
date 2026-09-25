# @ovr/queue

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
