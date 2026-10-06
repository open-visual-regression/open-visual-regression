# @ovr/ui

## 0.1.3

### Patch Changes

- [#304](https://github.com/open-visual-regression/open-visual-regression/pull/304) [`8eb78b5`](https://github.com/open-visual-regression/open-visual-regression/commit/8eb78b5d41a752f9e544adf3c2d975ec518de2fa) Thanks [@tgfischer](https://github.com/tgfischer)! - Add a jobs page to the admin settings where flaky detection can be turned on, scheduled and tuned.

## 0.1.2

### Patch Changes

- [#289](https://github.com/open-visual-regression/open-visual-regression/pull/289) [`1550283`](https://github.com/open-visual-regression/open-visual-regression/commit/1550283a9514748c485b49f8084004d1d598b9d6) Thanks [@tgfischer](https://github.com/tgfischer)! - Show a flaky badge on snapshots of flaky stories.

## 0.1.1

### Patch Changes

- [#257](https://github.com/open-visual-regression/open-visual-regression/pull/257) [`4177ca9`](https://github.com/open-visual-regression/open-visual-regression/commit/4177ca9e0503839b9c40b34041ef9e981076edf4) Thanks [@tgfischer](https://github.com/tgfischer)! - Show a warning badge on snapshot cards when the story rendered with an uncaught error.

- [#251](https://github.com/open-visual-regression/open-visual-regression/pull/251) [`12bbb1e`](https://github.com/open-visual-regression/open-visual-regression/commit/12bbb1ee61ebf33b75e1a0741b871ae144376eaf) Thanks [@tgfischer](https://github.com/tgfischer)! - Add a "view baseline" button to the project builds page.

## 0.1.0

### Minor Changes

- [#189](https://github.com/open-visual-regression/open-visual-regression/pull/189) [`bf346a2`](https://github.com/open-visual-regression/open-visual-regression/commit/bf346a26490a2b02589f94ce714dd8ac54cebf94) Thanks [@tgfischer](https://github.com/tgfischer)! - Show a skipped story on the build as `skipped`.

  A story with `parameters.ovr.skip` produced no snapshot at all, so it vanished
  from the build with nothing to say it had ever been there. It now gets one
  snapshot per story, in a new `skipped` status: nothing is captured, diffed, or
  queued for review, but the story is visible on the build, in the status filter,
  and in the build's snapshot counts.

  The diff-completion check ignores skipped snapshots, so they neither hold a
  build open nor get swept up when one is canceled or reaped.
