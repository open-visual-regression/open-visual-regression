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
