# @open-visual-regression/cli

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
