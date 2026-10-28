# @ovr/bull-board

## 0.1.21

### Patch Changes

- Updated dependencies [[`7a73f92`](https://github.com/open-visual-regression/open-visual-regression/commit/7a73f92fcdbd28af33cb9b8b0b96b3bc66f9be70), [`3ecc66d`](https://github.com/open-visual-regression/open-visual-regression/commit/3ecc66d08cd328b884dfe15560d7ed8ef9f0c2da)]:
  - @ovr/queue@0.2.8

## 0.1.20

### Patch Changes

- Updated dependencies [[`8bb7448`](https://github.com/open-visual-regression/open-visual-regression/commit/8bb74484257bc01831da1207be516dd01c3ad21c), [`79276f2`](https://github.com/open-visual-regression/open-visual-regression/commit/79276f236ad32d79fab0b5ad9494697490b2d562)]:
  - @ovr/queue@0.2.7

## 0.1.19

### Patch Changes

- [#429](https://github.com/open-visual-regression/open-visual-regression/pull/429) [`5c06f39`](https://github.com/open-visual-regression/open-visual-regression/commit/5c06f390a44b69f3aa0b8a7be22391528a45dfba) Thanks [@tgfischer](https://github.com/tgfischer)! - Docker images now run on Node.js 24.22.1, which includes the October 2026 Node.js security fixes.

- Updated dependencies [[`c6930b4`](https://github.com/open-visual-regression/open-visual-regression/commit/c6930b404c01abf9b6a25cda64ce6a31c405edbd)]:
  - @ovr/queue@0.2.6

## 0.1.18

### Patch Changes

- Updated dependencies [[`26e384d`](https://github.com/open-visual-regression/open-visual-regression/commit/26e384dce69f59d73896bf27bb95860329bab761)]:
  - @ovr/queue@0.2.5

## 0.1.17

### Patch Changes

- Updated dependencies []:
  - @ovr/queue@0.2.4

## 0.1.16

### Patch Changes

- Updated dependencies []:
  - @ovr/queue@0.2.3

## 0.1.15

### Patch Changes

- Updated dependencies []:
  - @ovr/queue@0.2.2

## 0.1.14

### Patch Changes

- Updated dependencies []:
  - @ovr/queue@0.2.1

## 0.1.13

### Patch Changes

- Updated dependencies [[`1a46b57`](https://github.com/open-visual-regression/open-visual-regression/commit/1a46b5760e151026056a0f7b5162b8991e97806c)]:
  - @ovr/queue@0.2.0

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
