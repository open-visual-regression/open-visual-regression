# @ovr/worker

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
  - @ovr/capture@0.1.1

## 0.2.0

### Minor Changes

- [#130](https://github.com/open-visual-regression/open-visual-regression/pull/130) [`a213cfb`](https://github.com/open-visual-regression/open-visual-regression/commit/a213cfbeb43de88f718a45d3445009cfaaa1b08f) Thanks [@tgfischer](https://github.com/tgfischer)! - Require Storybook 8.5 or newer.

  Older builds were never captured correctly — they failed partway through
  processing, after the upload, once per story. They are now rejected up front:
  `ovr snapshot storybook` reports the problem before uploading, and the server
  refuses the build before starting work on it. The error names the version it
  found.
