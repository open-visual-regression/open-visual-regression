# @ovr/storybook-compat

Knows the shape of a Storybook static build: which versions we support, how to
detect a build's version, and how to read its story list.

## Supported versions

The minimum is **Storybook 8.5** (`MINIMUM_STORYBOOK_VERSION` in
`src/version.ts`). Older builds are rejected at ingest — by the CLI before
upload, and by the worker before it starts capturing. The capture path relies on
preview behaviour older Storybooks lack, so lowering the floor takes more than
editing the constant.

## Fixtures

`fixtures/v8`, `v9` and `v10` each pin one major and install independently of
the repo workspace. `v8` pins 8.5.x, so the floor we advertise is the one
exercised. All three share the stories in `fixtures/stories`.

The builds are not committed:

```sh
pnpm --filter @ovr/storybook-compat fixtures:build          # skips ones already built
pnpm --filter @ovr/storybook-compat fixtures:build --force  # rebuild
pnpm --filter @ovr/storybook-compat fixtures:clean
```

## Running the suite

`pnpm test`, once the fixtures are built. Specs live here and in `@ovr/capture`
(`src/__tests__/storybookVersions.integration.test.ts`). Both skip when the
fixtures are missing — set `OVR_REQUIRE_STORYBOOK_FIXTURES=1`, as CI does, to
make that a failure instead.

## Adding a major

1. Copy the newest fixture to `fixtures/v<major>` without its `pnpm-lock.yaml`
   and pin the new version.
2. `pnpm --dir packages/storybook-compat/fixtures/v<major> install` to write the
   lockfile, and commit it. Builds install `--frozen-lockfile`.
3. Add the major to `STORYBOOK_FIXTURES` in `src/fixtures.ts`.
4. `pnpm --filter @ovr/storybook-compat fixtures:build`, then `pnpm test`.

## Affected stories

`findAffectedStories` (`src/affectedStories.ts`) works out which stories a set of
changed files can affect, so an upload can capture only those. It reads the
module graph Storybook writes with `storybook build --stats-json`
(`preview-stats.json`, Vite builder) from the directory it was built in, and walks each changed module
up through its importers to the story files that reach it.

It only traces JavaScript and TypeScript. Anything it cannot explain captures
every story instead of guessing:

- a module the preview itself loads (`preview.tsx`, global CSS, decorators);
- Storybook configuration, lockfiles, and build configuration (`*.config.*`,
  `tsconfig*.json`) at the repository root or in a package the bundle uses;
- any other non-code file in a package the bundle uses — CSS pulled in by
  `@import`, JSON, fonts, `package.json` — since tools can inline those without
  them becoming modules;
- a missing stats file, or one that does not match `index.json`.

Code that no story imports, Markdown, and files in packages the bundle never
touches are ignored. Callers can widen or narrow this with `externals` (always
capture everything) and `untraced` (always ignore) globs.
