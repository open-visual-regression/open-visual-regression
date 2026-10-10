# @ovr/storybook-compat

## 0.4.0

### Minor Changes

- [#329](https://github.com/open-visual-regression/open-visual-regression/pull/329) [`fccbfcc`](https://github.com/open-visual-regression/open-visual-regression/commit/fccbfcc46567472de7a49078064e1a3bdb8cbb63) Thanks [@tgfischer](https://github.com/tgfischer)! - `upload storybook --only-affected` traces Storybook builds made with Rspack through `storybook-builder-rsbuild`.

- [#327](https://github.com/open-visual-regression/open-visual-regression/pull/327) [`7a5880b`](https://github.com/open-visual-regression/open-visual-regression/commit/7a5880b45693cb7646e6012d4d3573a7041dc726) Thanks [@tgfischer](https://github.com/tgfischer)! - `upload storybook --only-affected` traces Storybook builds made with Webpack.

### Patch Changes

- [#326](https://github.com/open-visual-regression/open-visual-regression/pull/326) [`23e1da3`](https://github.com/open-visual-regression/open-visual-regression/commit/23e1da30b5606550e9d978e4ed9483907e94c870) Thanks [@tgfischer](https://github.com/tgfischer)! - `upload storybook --only-affected` reads `preview-stats.json` files larger than 512 MB, and says when one can't be parsed instead of calling it missing.

- [#322](https://github.com/open-visual-regression/open-visual-regression/pull/322) [`54c5823`](https://github.com/open-visual-regression/open-visual-regression/commit/54c5823f5c585f0b144ecaf0c60a59d056a7ad66) Thanks [@tgfischer](https://github.com/tgfischer)! - `upload storybook --only-affected` now captures every story for a Webpack or Rspack build instead of failing.

## 0.3.0

### Minor Changes

- [#239](https://github.com/open-visual-regression/open-visual-regression/pull/239) [`90758fc`](https://github.com/open-visual-regression/open-visual-regression/commit/90758fcee978338d94b2f5340f7d87b0b3c42159) Thanks [@tgfischer](https://github.com/tgfischer)! - Work out which stories a set of changed files can affect.

## 0.2.0

### Minor Changes

- [#189](https://github.com/open-visual-regression/open-visual-regression/pull/189) [`bf346a2`](https://github.com/open-visual-regression/open-visual-regression/commit/bf346a26490a2b02589f94ce714dd8ac54cebf94) Thanks [@tgfischer](https://github.com/tgfischer)! - Document `parameters.ovr` on the docs site: where parameters can be set, and
  what `skip` does to a story's baselines.

  Adds `@ovr/storybook-compat/parameters`, the story parameters the worker
  resolves out of a bundle.
