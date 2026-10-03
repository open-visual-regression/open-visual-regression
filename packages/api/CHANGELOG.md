# @ovr/api

## 0.2.5

### Patch Changes

- [#288](https://github.com/open-visual-regression/open-visual-regression/pull/288) [`1651aaf`](https://github.com/open-visual-regression/open-visual-regression/commit/1651aaf99b25db20472c486080bbc87b0b13588e) Thanks [@tgfischer](https://github.com/tgfischer)! - Report whether each snapshot is flaky.

## 0.2.4

### Patch Changes

- [#281](https://github.com/open-visual-regression/open-visual-regression/pull/281) [`e78e057`](https://github.com/open-visual-regression/open-visual-regression/commit/e78e057c045bdbbff81939d6508a558823579c9a) Thanks [@tgfischer](https://github.com/tgfischer)! - Enforce review rules on the server instead of only hiding buttons. Voting on a snapshot is refused once a newer build has landed on the branch or the snapshot failed, and approving or rejecting a whole build is also refused while it is running, canceled, or errored. Build and snapshot details now expose `isReviewable` so the UI shows the review buttons only when a vote would be accepted.

## 0.2.3

### Patch Changes

- [#249](https://github.com/open-visual-regression/open-visual-regression/pull/249) [`73f7fda`](https://github.com/open-visual-regression/open-visual-regression/commit/73f7fda61041627356c9ad7a183efb4007f47ac0) Thanks [@tgfischer](https://github.com/tgfischer)! - Add an endpoint that returns a project's baseline build: the latest successful build on its main branch.

- [#257](https://github.com/open-visual-regression/open-visual-regression/pull/257) [`4177ca9`](https://github.com/open-visual-regression/open-visual-regression/commit/4177ca9e0503839b9c40b34041ef9e981076edf4) Thanks [@tgfischer](https://github.com/tgfischer)! - Show a warning badge on snapshot cards when the story rendered with an uncaught error.

- [#252](https://github.com/open-visual-regression/open-visual-regression/pull/252) [`9e51c55`](https://github.com/open-visual-regression/open-visual-regression/commit/9e51c5526547457dd7519d79d7854fa99ee773ed) Thanks [@tgfischer](https://github.com/tgfischer)! - Add stable links to a project's baseline build and baseline Storybook.

## 0.2.2

### Patch Changes

- [#242](https://github.com/open-visual-regression/open-visual-regression/pull/242) [`aff53e1`](https://github.com/open-visual-regression/open-visual-regression/commit/aff53e1caa0235dd8c7283d0f8c6eef7cc2352a3) Thanks [@tgfischer](https://github.com/tgfischer)! - Add `upload storybook --only-affected` to capture only the stories a change can affect.

- [#241](https://github.com/open-visual-regression/open-visual-regression/pull/241) [`16d2294`](https://github.com/open-visual-regression/open-visual-regression/commit/16d22944b317faf70e5b54f256231c4f73816aee) Thanks [@tgfischer](https://github.com/tgfischer)! - Let an upload skip targets its changes can't affect. Skipped targets keep their baselines.

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
