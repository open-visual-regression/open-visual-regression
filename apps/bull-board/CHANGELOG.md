# @ovr/bull-board

## 0.1.12

### Patch Changes

- Updated dependencies [[`f059de4`](https://github.com/open-visual-regression/open-visual-regression/commit/f059de4dd22306ed975024b2680bd1d25d6fcfaa), [`990c406`](https://github.com/open-visual-regression/open-visual-regression/commit/990c406d9b44c6c258fcc84b05d97497381306fe), [`839acca`](https://github.com/open-visual-regression/open-visual-regression/commit/839accaa17ba3e735f64cc62fdad9665a1e5d48c)]:
  - @ovr/queue@0.1.11

## 0.1.11

### Patch Changes

- Updated dependencies [[`2188523`](https://github.com/open-visual-regression/open-visual-regression/commit/21885235b03d37d3bb2c8cca94cecf7d570cbd91)]:
  - @ovr/queue@0.1.10

## 0.1.10

### Patch Changes

- Updated dependencies [[`01010bd`](https://github.com/open-visual-regression/open-visual-regression/commit/01010bdea54b07eda9bb4b2b131abd1055ee82a1)]:
  - @ovr/queue@0.1.9

## 0.1.9

### Patch Changes

- Updated dependencies []:
  - @ovr/queue@0.1.8

## 0.1.8

### Patch Changes

- Updated dependencies [[`16d2294`](https://github.com/open-visual-regression/open-visual-regression/commit/16d22944b317faf70e5b54f256231c4f73816aee)]:
  - @ovr/queue@0.1.7

## 0.1.7

### Patch Changes

- Updated dependencies []:
  - @ovr/queue@0.1.6

## 0.1.6

### Patch Changes

- [#233](https://github.com/open-visual-regression/open-visual-regression/pull/233) [`7237920`](https://github.com/open-visual-regression/open-visual-regression/commit/72379203107e43351fbcc25628fccd0d1295bde7) Thanks [@tgfischer](https://github.com/tgfischer)! - Support Redis Cluster. Set `REDIS_MODE=cluster`, or `redis.mode: cluster` in the Helm chart.

- Updated dependencies [[`7237920`](https://github.com/open-visual-regression/open-visual-regression/commit/72379203107e43351fbcc25628fccd0d1295bde7)]:
  - @ovr/queue@0.1.5

## 0.1.5

### Patch Changes

- Updated dependencies [[`2273afc`](https://github.com/open-visual-regression/open-visual-regression/commit/2273afc3e92f607a538bb5ca7c7f931495b476d1)]:
  - @ovr/queue@0.1.4

## 0.1.4

### Patch Changes

- Updated dependencies []:
  - @ovr/queue@0.1.3

## 0.1.3

### Patch Changes

- Updated dependencies []:
  - @ovr/queue@0.1.2

## 0.1.2

### Patch Changes

- Updated dependencies []:
  - @ovr/queue@0.1.1

## 0.1.1

### Patch Changes

- [#139](https://github.com/open-visual-regression/open-visual-regression/pull/139) [`81b2201`](https://github.com/open-visual-regression/open-visual-regression/commit/81b220148f98e4e35ac49462af112719c088d1ff) Thanks [@tgfischer](https://github.com/tgfischer)! - Route all remaining logging through the shared application logger.

  better-auth wrote to its own console logger, and the worker, the builds
  retention module and bull-board wrote to `console` directly. That output
  ignored `LOG_LEVEL` and did not match the structured format everything else
  emits. It now goes through `@ovr/logger`.

  The `ovr` CLI and the database migrate script still write to `console`, since
  that output is the program's own interface rather than logging.
