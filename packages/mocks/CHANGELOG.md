# @ovr/mocks

## 0.2.9

### Patch Changes

- Updated dependencies [[`f059de4`](https://github.com/open-visual-regression/open-visual-regression/commit/f059de4dd22306ed975024b2680bd1d25d6fcfaa), [`c1f0578`](https://github.com/open-visual-regression/open-visual-regression/commit/c1f0578966bd70195900367943cc9db9511b2789), [`990c406`](https://github.com/open-visual-regression/open-visual-regression/commit/990c406d9b44c6c258fcc84b05d97497381306fe), [`756a5b3`](https://github.com/open-visual-regression/open-visual-regression/commit/756a5b38e9fee5c07525daf34227cca2c934842f), [`43e1f76`](https://github.com/open-visual-regression/open-visual-regression/commit/43e1f763904fd2d3b7f807205faad089a8db9db9)]:
  - @ovr/api@0.2.6
  - @ovr/db@0.2.8

## 0.2.8

### Patch Changes

- Updated dependencies [[`925dfb7`](https://github.com/open-visual-regression/open-visual-regression/commit/925dfb762442ab2fc021edf33bfdd087a2246785), [`2188523`](https://github.com/open-visual-regression/open-visual-regression/commit/21885235b03d37d3bb2c8cca94cecf7d570cbd91), [`1651aaf`](https://github.com/open-visual-regression/open-visual-regression/commit/1651aaf99b25db20472c486080bbc87b0b13588e), [`f5744e5`](https://github.com/open-visual-regression/open-visual-regression/commit/f5744e59bd6663553adf517b4efc5ee985ad32bb), [`85ebeca`](https://github.com/open-visual-regression/open-visual-regression/commit/85ebeca9697afe1ce475cb4b25d8012efa70409c), [`4c3d8c6`](https://github.com/open-visual-regression/open-visual-regression/commit/4c3d8c6b7143869b1f8d7ece13feaa1acae558ad), [`65c8f48`](https://github.com/open-visual-regression/open-visual-regression/commit/65c8f4824fe4cf4642fd3ad8b261d30ded2a6a68)]:
  - @ovr/db@0.2.7
  - @ovr/api@0.2.5

## 0.2.7

### Patch Changes

- Updated dependencies [[`e78e057`](https://github.com/open-visual-regression/open-visual-regression/commit/e78e057c045bdbbff81939d6508a558823579c9a)]:
  - @ovr/api@0.2.4

## 0.2.6

### Patch Changes

- Updated dependencies [[`4ecd06f`](https://github.com/open-visual-regression/open-visual-regression/commit/4ecd06f3927efe6b17865e6d877e7f5692164238)]:
  - @ovr/db@0.2.6

## 0.2.5

### Patch Changes

- Updated dependencies [[`73f7fda`](https://github.com/open-visual-regression/open-visual-regression/commit/73f7fda61041627356c9ad7a183efb4007f47ac0), [`4177ca9`](https://github.com/open-visual-regression/open-visual-regression/commit/4177ca9e0503839b9c40b34041ef9e981076edf4), [`9e51c55`](https://github.com/open-visual-regression/open-visual-regression/commit/9e51c5526547457dd7519d79d7854fa99ee773ed)]:
  - @ovr/api@0.2.3
  - @ovr/db@0.2.5

## 0.2.4

### Patch Changes

- Updated dependencies [[`aff53e1`](https://github.com/open-visual-regression/open-visual-regression/commit/aff53e1caa0235dd8c7283d0f8c6eef7cc2352a3), [`16d2294`](https://github.com/open-visual-regression/open-visual-regression/commit/16d22944b317faf70e5b54f256231c4f73816aee)]:
  - @ovr/api@0.2.2
  - @ovr/db@0.2.4

## 0.2.3

### Patch Changes

- Updated dependencies [[`9edbf39`](https://github.com/open-visual-regression/open-visual-regression/commit/9edbf39d9dc6b56d1529668611c54d557067bbe8)]:
  - @ovr/db@0.2.3

## 0.2.2

### Patch Changes

- Updated dependencies [[`c07442d`](https://github.com/open-visual-regression/open-visual-regression/commit/c07442d355afa70ef5a81e9b35936ac5b9e3347f), [`9ba80f1`](https://github.com/open-visual-regression/open-visual-regression/commit/9ba80f10bf007bd5741f58ca1c5282f88b4e92b6), [`2273afc`](https://github.com/open-visual-regression/open-visual-regression/commit/2273afc3e92f607a538bb5ca7c7f931495b476d1)]:
  - @ovr/api@0.2.1
  - @ovr/db@0.2.2

## 0.2.1

### Patch Changes

- Updated dependencies [[`270db0e`](https://github.com/open-visual-regression/open-visual-regression/commit/270db0e0d44f4b62716df326198c6366b71ee3b3)]:
  - @ovr/db@0.2.1

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

- Updated dependencies [[`4d82876`](https://github.com/open-visual-regression/open-visual-regression/commit/4d828762aa9e5a8e49345d58f2276d18f3467127), [`bf346a2`](https://github.com/open-visual-regression/open-visual-regression/commit/bf346a26490a2b02589f94ce714dd8ac54cebf94)]:
  - @ovr/api@0.2.0
  - @ovr/db@0.2.0

## 0.1.1

### Patch Changes

- Updated dependencies [[`37027a0`](https://github.com/open-visual-regression/open-visual-regression/commit/37027a0d7d3df3b87d11a7e47bedac2498838f39), [`dff0593`](https://github.com/open-visual-regression/open-visual-regression/commit/dff059342ca035643a693fb6a459a3d948a451ee)]:
  - @ovr/db@0.1.1
  - @ovr/api@0.1.1
