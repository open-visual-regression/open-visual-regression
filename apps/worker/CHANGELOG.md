# @ovr/worker

## 0.2.0

### Minor Changes

- [#130](https://github.com/open-visual-regression/open-visual-regression/pull/130) [`a213cfb`](https://github.com/open-visual-regression/open-visual-regression/commit/a213cfbeb43de88f718a45d3445009cfaaa1b08f) Thanks [@tgfischer](https://github.com/tgfischer)! - Require Storybook 8.5 or newer.

  Older builds were never captured correctly — they failed partway through
  processing, after the upload, once per story. They are now rejected up front:
  `ovr snapshot storybook` reports the problem before uploading, and the server
  refuses the build before starting work on it. The error names the version it
  found.
