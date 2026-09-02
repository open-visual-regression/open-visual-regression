# @ovr/worker

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
  - @ovr/capture@0.1.1

## 0.2.0

### Minor Changes

- [#130](https://github.com/open-visual-regression/open-visual-regression/pull/130) [`a213cfb`](https://github.com/open-visual-regression/open-visual-regression/commit/a213cfbeb43de88f718a45d3445009cfaaa1b08f) Thanks [@tgfischer](https://github.com/tgfischer)! - Require Storybook 8.5 or newer.

  Older builds were never captured correctly — they failed partway through
  processing, after the upload, once per story. They are now rejected up front:
  `ovr snapshot storybook` reports the problem before uploading, and the server
  refuses the build before starting work on it. The error names the version it
  found.
