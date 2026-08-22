# @ovr/storybook-compat

Everything that knows about the shape of a Storybook static build: which
versions we support, how to detect the version of a build, and how to read the
story list out of `index.json`.

It also owns the fixtures that prove those claims — one real Storybook install
per supported major, built and driven by the compatibility suite.

## Supported versions

The minimum is **Storybook 8.5** (`MINIMUM_STORYBOOK_VERSION` in `src/version.ts`).

8.5 is where the preview started emitting the `storyFinished` channel event.
The capture strategy waits on that event to know a story's play function has
finished, so on 8.4 and older every story would sit until the render timeout
rather than being captured. Builds we can identify as older are rejected at
ingest instead — by the CLI before upload, and by the worker before it spends a
capture job per story.

Detection uses `project.json`, which `storybook build` writes next to
`index.json` and which carries the exact `storybookVersion`. When a project has
disabled that file, `index.json`'s `v` still separates Storybook 7 (`v4`) from
Storybook 8 and newer (`v5`), which is enough to turn away the one older major
that otherwise looks current. A build we cannot place at all is allowed
through — the manifest parser gives a better error for those.

## Fixtures

`fixtures/v8`, `fixtures/v9` and `fixtures/v10` are standalone packages, each
pinning one Storybook major. Three Storybook majors cannot share a dependency
tree, so each carries its own `pnpm-workspace.yaml` and resolves independently
of the repo workspace.

Their lockfiles are committed. They are large and generated — `.gitattributes`
marks them `linguist-generated` so review diffs collapse them — but a
compatibility suite is only meaningful if every run tests the same Storybook
build, and without a lockfile the version under test would drift with whatever
was newest when a CI cache happened to be populated.

`v8` pins the exact minimum (8.5.x) rather than the newest 8.x, so the floor we
advertise is the floor that gets exercised.

The stories live once in `fixtures/stories` and are copied into each fixture by
`fixtures:build`, so all three majors run identical story sources:

| Story | What it covers |
|---|---|
| `Default` | A plain story that renders |
| `WithOvrParameters` | `parameters.ovr` viewport and threshold overrides |
| `Skipped` | `parameters.ovr.skip` |
| `WithPlay` | A play function that passes |
| `PlayThrows` | A play function that throws |
| autodocs entry | Docs pages are filtered out of the story list |

The builds themselves are not committed. Build them with:

```sh
pnpm --filter @ovr/storybook-compat fixtures:build          # skips ones already built
pnpm --filter @ovr/storybook-compat fixtures:build --force  # rebuild
pnpm --filter @ovr/storybook-compat fixtures:clean
```

## Running the compatibility suite

The tests split by what they need:

- **`@ovr/storybook-compat`** — version detection and manifest parsing. Needs
  only the build output on disk.
- **`@ovr/capture`** (`src/__tests__/storybookVersions.integration.test.ts`) —
  boots each build in a real browser and runs the production capture strategy
  against it, then puts a real bundle through extract and capture. Needs a
  browser and the integration infrastructure.

Both skip when the fixtures are not built, so a normal `pnpm test` stays fast.
CI sets `OVR_REQUIRE_STORYBOOK_FIXTURES=1`, which turns a missing fixture into a
failure instead of a silent skip.

## Adding a Storybook major

1. Copy the newest fixture to `fixtures/v<major>` (without its `pnpm-lock.yaml`)
   and pin the new version in its `package.json`.
2. Add the major to `STORYBOOK_FIXTURES` in `src/fixtures.ts`.
3. `pnpm --filter @ovr/storybook-compat fixtures:build` — with no lockfile
   present it resolves and writes one. Commit it.
4. Run both suites.

Nothing else is version-aware: if a new major changes the manifest, the preview
globals or the channel events, that is what the suite is there to catch.
