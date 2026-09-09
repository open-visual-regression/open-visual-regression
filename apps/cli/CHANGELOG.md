# @open-visual-regression/cli

## 0.2.1

### Patch Changes

- [#172](https://github.com/open-visual-regression/open-visual-regression/pull/172) [`0803b5c`](https://github.com/open-visual-regression/open-visual-regression/commit/0803b5c13413cb3295db05de9af3c107142d8ade) Thanks [@tgfischer](https://github.com/tgfischer)! - Stop the published CLI from depending on an unpublished package.

  `@ovr/storybook-compat` is an internal, private package, but the CLI declared it
  as a runtime dependency. On publish `workspace:*` is rewritten to a version no
  registry has, so `npm install @open-visual-regression/cli` failed to resolve it.
  The CLI already bundles that code with tsup, the same way it bundles `@ovr/api`,
  so the dependency is now a devDependency and installs resolve cleanly. Nothing
  about the bundled output or the commands changes.

## 0.2.0

### Minor Changes

- [#130](https://github.com/open-visual-regression/open-visual-regression/pull/130) [`a213cfb`](https://github.com/open-visual-regression/open-visual-regression/commit/a213cfbeb43de88f718a45d3445009cfaaa1b08f) Thanks [@tgfischer](https://github.com/tgfischer)! - Require Storybook 8.5 or newer.

  Older builds were never captured correctly — they failed partway through
  processing, after the upload, once per story. They are now rejected up front:
  `ovr snapshot storybook` reports the problem before uploading, and the server
  refuses the build before starting work on it. The error names the version it
  found.

## 0.1.1

### Patch Changes

- [#30](https://github.com/open-visual-regression/open-visual-regression/pull/30) [`2000424`](https://github.com/open-visual-regression/open-visual-regression/commit/20004242b2f33c92b8a6cdf10beb032de5295f71) Thanks [@tgfischer](https://github.com/tgfischer)! - Publish under the `@open-visual-regression` npm organization scope (previously `@ovr/cli`, never published).
