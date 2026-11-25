# @ovr/diff-analysis

## 0.0.2

### Patch Changes

- [#616](https://github.com/open-visual-regression/open-visual-regression/pull/616) [`565bff6`](https://github.com/open-visual-regression/open-visual-regression/commit/565bff6b7fd39fe42f387d8d442e51f5a322921a) Thanks [@tgfischer](https://github.com/tgfischer)! - Diff images highlight content that moved because the spacing above it changed, like a margin that shrank, instead of showing a red bar at the bottom of the screenshot.

- [#617](https://github.com/open-visual-regression/open-visual-regression/pull/617) [`a82d0ec`](https://github.com/open-visual-regression/open-visual-regression/commit/a82d0ec010544b066ba0abb18a59745690e73645) Thanks [@tgfischer](https://github.com/tgfischer)! - Diff images tint each area that changed instead of painting individual pixels red, so text that moved or changed stays readable under the highlight.

## 0.0.1

### Patch Changes

- [#589](https://github.com/open-visual-regression/open-visual-regression/pull/589) [`3afcaea`](https://github.com/open-visual-regression/open-visual-regression/commit/3afcaeaad55b57de120525e896376edf6fdba27a) Thanks [@tgfischer](https://github.com/tgfischer)! - Diff images now highlight only what changed. Content pushed down or sideways by a change is no longer painted red.
