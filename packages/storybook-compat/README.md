# @ovr/storybook-compat

Everything that knows about the shape of a Storybook static build: which
versions we support, how to detect the version of a build, and how to read the
story list out of `index.json`.

## Supported versions

The minimum is **Storybook 8.5**, set by `MINIMUM_STORYBOOK_VERSION` in
`src/version.ts`. Builds we can identify as older are rejected at ingest — by
the CLI before upload, and by the worker before it starts capturing.

The floor is not arbitrary and lowering it will not work: the capture path
depends on preview behaviour that older Storybooks do not have.
`git log -S MINIMUM_STORYBOOK_VERSION` has the specifics.

A build's version comes from `project.json`, which `storybook build` writes next
to `index.json`. When a project has disabled that file, `index.json`'s `v` is a
coarse fallback that is still enough to turn away Storybook 7. A build we cannot
place at all is allowed through — the manifest parser gives a better error for
those.
