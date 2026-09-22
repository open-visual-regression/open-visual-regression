# @ovr/api

## 0.2.1

### Patch Changes

- [#224](https://github.com/open-visual-regression/open-visual-regression/pull/224) [`c07442d`](https://github.com/open-visual-regression/open-visual-regression/commit/c07442d355afa70ef5a81e9b35936ac5b9e3347f) Thanks [@tgfischer](https://github.com/tgfischer)! - Expose `snapshots.rebuild`, which re-captures the given snapshots of a build.

  Reviewers and admins can rebuild up to 100 snapshots of a build at a time.
  `snapshots.getOne` now reports `isRebuildable` so a caller can tell whether a
  snapshot can be rebuilt before asking.

## 0.2.0

### Minor Changes

- [#186](https://github.com/open-visual-regression/open-visual-regression/pull/186) [`4d82876`](https://github.com/open-visual-regression/open-visual-regression/commit/4d828762aa9e5a8e49345d58f2276d18f3467127) Thanks [@tgfischer](https://github.com/tgfischer)! - Let `builds.list` filter by commit SHA.

  Adds a `commitShas` filter alongside the existing `branches` and `authors`
  filters, so a caller that already knows a commit (an agent in a repo
  checkout, say) can look up its build directly instead of filtering client-side
  through a full branch listing.

- [#189](https://github.com/open-visual-regression/open-visual-regression/pull/189) [`bf346a2`](https://github.com/open-visual-regression/open-visual-regression/commit/bf346a26490a2b02589f94ce714dd8ac54cebf94) Thanks [@tgfischer](https://github.com/tgfischer)! - Show a skipped story on the build as `skipped`.

  A story with `parameters.ovr.skip` produced no snapshot at all, so it vanished
  from the build with nothing to say it had ever been there. It now gets one
  snapshot per story, in a new `skipped` status: nothing is captured, diffed, or
  queued for review, but the story is visible on the build, in the status filter,
  and in the build's snapshot counts.

  The diff-completion check ignores skipped snapshots, so they neither hold a
  build open nor get swept up when one is canceled or reaped.

## 0.1.1

### Patch Changes

- [#175](https://github.com/open-visual-regression/open-visual-regression/pull/175) [`dff0593`](https://github.com/open-visual-regression/open-visual-regression/commit/dff059342ca035643a693fb6a459a3d948a451ee) Thanks [@tgfischer](https://github.com/tgfischer)! - Only mark a snapshot errored when the story itself failed to render.

  An uncaught exception seen through Playwright's `pageerror` event was folded
  into `hasRenderError`, alongside the render and play failures Storybook reports
  over its own channel. A story that rendered correctly and then threw — an error
  a boundary already recovered from, or one raised from a timer after the story
  finished — was marked errored, skipped its diff, and failed its build, even
  though its screenshot was perfectly usable.

  `hasRenderError` now comes only from Storybook's render and play result. The
  `pageerror` signal is kept separately as `hasUncaughtPageError`, which leaves
  the snapshot diffable and raises a warning on it instead. A snapshot also
  records the reason it errored in `errorMessage`, so it names what went wrong
  rather than always reading "This snapshot failed to capture", and a build whose
  snapshots errored says so instead of reporting a failure to diff against a
  baseline.
