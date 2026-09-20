# @open-visual-regression/cli

## 0.4.0

### Minor Changes

- [#208](https://github.com/open-visual-regression/open-visual-regression/pull/208) [`f7210db`](https://github.com/open-visual-regression/open-visual-regression/commit/f7210db2b9c93147fe6414209124cb721d2194b5) Thanks [@tgfischer](https://github.com/tgfischer)! - Filter and paginate `builds list`.

  The command only ever returned the first twenty builds and dropped the server's
  next-page cursor, so there was no way to reach an older build from the CLI, and
  it exposed two of the filters the API accepts. It now takes `--status`,
  `--author` and `--search` as well, `--branch` and `--commit` accept several
  values apiece, `--sort` picks the direction, and `--limit`, `--cursor` and
  `--all` walk the pages. A status the server does not recognize is rejected
  before the request is sent, and an empty result reports the filters that
  produced it so a mistyped branch or author is visible rather than silent.

  `--json` now prints `{ builds, total, nextCursor }` instead of a bare array,
  since the page alone cannot say whether more builds match or where to resume.

- [#212](https://github.com/open-visual-regression/open-visual-regression/pull/212) [`4f68d6c`](https://github.com/open-visual-regression/open-visual-regression/commit/4f68d6ccbfdd780bc24d32c55bfec9dcd8378dae) Thanks [@tgfischer](https://github.com/tgfischer)! - Add `ovr diffs get`.

  A snapshot's diff — its pixel diff count, diff percentage and baseline — was
  only visible in the dashboard, so confirming whether a `needs_review` snapshot
  is a real regression or an intentional change meant leaving the terminal.
  `ovr diffs get <snapshotId>` prints all of it, including the baseline's commit
  and a link to it when the project has a git integration, so a diff can be
  sized up from the CLI before deciding whether to open the review page.

- [#209](https://github.com/open-visual-regression/open-visual-regression/pull/209) [`b85db41`](https://github.com/open-visual-regression/open-visual-regression/commit/b85db413bc52d096e48bda83aee74e9be9802a6f) Thanks [@tgfischer](https://github.com/tgfischer)! - Add `ovr snapshots list` and `ovr snapshots counts`.

  A failing build could be found from the CLI but not opened: `builds get` reports
  that a build needs review without saying which of its snapshots changed, so the
  only way from a build ID to an actual regression was the dashboard.

  `snapshots counts` breaks a build down by status, and `snapshots list` prints a
  row per snapshot carrying its story, browser, viewport and the percentage of
  pixels that differ from its baseline. Both take a personal access token, and
  `list` accepts the same filters the dashboard uses — `--status`, `--browser`,
  `--viewport` and `--search` — so `--status needs_review` narrows a build to just
  the snapshots waiting on a decision. Pages are walked with `--limit`, `--cursor`
  and `--all`.

- [#211](https://github.com/open-visual-regression/open-visual-regression/pull/211) [`98243cb`](https://github.com/open-visual-regression/open-visual-regression/commit/98243cb2b6501550f02174ab3d752d60e2beb4e3) Thanks [@tgfischer](https://github.com/tgfischer)! - Add `ovr snapshots get`.

  A snapshot's console and error logs are captured on every build but were not
  reachable from anywhere in the CLI — the dashboard was the only way to see why a
  story errored. `ovr snapshots get <snapshotId>` prints the snapshot's status,
  story, browser, viewport and image path, whether the page threw an uncaught
  error, and its captured logs, so a failing snapshot can be root-caused from a
  build id without opening a browser.

- [#210](https://github.com/open-visual-regression/open-visual-regression/pull/210) [`ebeb1dd`](https://github.com/open-visual-regression/open-visual-regression/commit/ebeb1ddb83c935cd3f0efd6e3b735543c2022c62) Thanks [@tgfischer](https://github.com/tgfischer)! - Rename `ovr snapshot storybook` to `ovr upload storybook`.

  The CLI does not capture anything — it uploads a Storybook build and the server
  screenshots and diffs it — so `snapshot` described the pipeline rather than the
  command, and it sat one letter away from the new `ovr snapshots` group for
  inspecting a build's snapshots.

  `ovr snapshot storybook` still works and behaves identically, including its exit
  codes, but prints a deprecation notice on stderr so stdout stays parseable. It
  will be removed in the next major release.

### Patch Changes

- [#207](https://github.com/open-visual-regression/open-visual-regression/pull/207) [`fac1a51`](https://github.com/open-visual-regression/open-visual-regression/commit/fac1a51aea0200e5df2ed0e1700acff5096c7625) Thanks [@tgfischer](https://github.com/tgfischer)! - Correct the README's documented authentication requirements.

  It claimed every command takes a project-scoped API key, which has not been
  true since `builds list` and `builds get` landed — those read builds through a
  personal access token and reject a project API key outright. The README now
  describes both token kinds and which commands accept each, matching the
  authentication reference page in the docs.

## 0.3.0

### Minor Changes

- [#186](https://github.com/open-visual-regression/open-visual-regression/pull/186) [`4d82876`](https://github.com/open-visual-regression/open-visual-regression/commit/4d828762aa9e5a8e49345d58f2276d18f3467127) Thanks [@tgfischer](https://github.com/tgfischer)! - Add `ovr builds get <buildId>`.

  Prints full detail for one build (status, branch, commit, project, name,
  author, created, and error/canceled-by when present), complementing
  `ovr builds list` — list to find a build, then get it for the full picture.

- [#187](https://github.com/open-visual-regression/open-visual-regression/pull/187) [`ca8a7c2`](https://github.com/open-visual-regression/open-visual-regression/commit/ca8a7c280239a724169d14c8b83d3e0dec35c76f) Thanks [@tgfischer](https://github.com/tgfischer)! - Add `--json` to `ovr builds list` and `ovr builds get`.

  Prints the raw build object(s) instead of the formatted table/text, so a
  script or another program parsing the CLI's output doesn't have to scrape
  plain text.

- [#186](https://github.com/open-visual-regression/open-visual-regression/pull/186) [`4d82876`](https://github.com/open-visual-regression/open-visual-regression/commit/4d828762aa9e5a8e49345d58f2276d18f3467127) Thanks [@tgfischer](https://github.com/tgfischer)! - Add `ovr builds list [--branch <name>] [--commit <sha>]`.

  The CLI only had write-side commands (`snapshot storybook`, upload + poll).
  This lets an agent in a repo checkout ask what OVR thinks about the code it's
  looking at, from a terminal, using a personal access token instead of relying
  on a human to check the web UI.

- [#186](https://github.com/open-visual-regression/open-visual-regression/pull/186) [`4d82876`](https://github.com/open-visual-regression/open-visual-regression/commit/4d828762aa9e5a8e49345d58f2276d18f3467127) Thanks [@tgfischer](https://github.com/tgfischer)! - Let `ovr.config` set a default server URL.

  `snapshot storybook`, `builds list`, and `builds get` all required
  `--server-url` on every invocation. `ovr.config` can now set a `serverUrl`
  used whenever the flag is omitted; passing `--server-url` still overrides it.

### Patch Changes

- [#190](https://github.com/open-visual-regression/open-visual-regression/pull/190) [`3938f6c`](https://github.com/open-visual-regression/open-visual-regression/commit/3938f6c24b176120ca886624cb4df145be85c47a) Thanks [@tgfischer](https://github.com/tgfischer)! - Deduplicate CLI error reporting.

  `snapshot storybook`, `builds list`, and `builds get` each repeated the same
  ORPCError-vs-generic-error formatting in their catch blocks. Extracted into
  `formatCliError`, a pure, tested function shared by all three — no behavior
  change.

- [#189](https://github.com/open-visual-regression/open-visual-regression/pull/189) [`bf346a2`](https://github.com/open-visual-regression/open-visual-regression/commit/bf346a26490a2b02589f94ce714dd8ac54cebf94) Thanks [@tgfischer](https://github.com/tgfischer)! - Show a skipped story on the build as `skipped`.

  A story with `parameters.ovr.skip` produced no snapshot at all, so it vanished
  from the build with nothing to say it had ever been there. It now gets one
  snapshot per story, in a new `skipped` status: nothing is captured, diffed, or
  queued for review, but the story is visible on the build, in the status filter,
  and in the build's snapshot counts.

  The diff-completion check ignores skipped snapshots, so they neither hold a
  build open nor get swept up when one is canceled or reaped.

- [#189](https://github.com/open-visual-regression/open-visual-regression/pull/189) [`bf346a2`](https://github.com/open-visual-regression/open-visual-regression/commit/bf346a26490a2b02589f94ce714dd8ac54cebf94) Thanks [@tgfischer](https://github.com/tgfischer)! - Document `parameters.ovr` on the docs site: where parameters can be set, and
  what `skip` does to a story's baselines.

  Adds `@ovr/storybook-compat/parameters`, the story parameters the worker
  resolves out of a bundle.

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
