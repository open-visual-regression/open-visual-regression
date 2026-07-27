# Changesets

This directory is managed by [Changesets](https://github.com/changesets/changesets),
which drives versioning and npm publishing for the project's **publishable**
packages. Today that means `@open-visual-regression/cli` — every other workspace package is
`private: true` and is skipped automatically.

The web and worker Docker images are **not** versioned here. They are released
independently by tagging the repo `vX.Y.Z`, which triggers the image build in
`.github/workflows/ci.yml`. Changesets and the app image release are two
separate release trains on purpose: a CLI change should not rebuild the server
images, and a server change should not bump the CLI.

## Adding a changeset

When you make a change to `@open-visual-regression/cli` that users should see in a release, run:

```bash
pnpm changeset
```

Pick the semver bump (patch/minor/major) and write a short summary. This creates
a markdown file in this directory — commit it alongside your change.

## How a release happens

On merge to `main`, the `release` workflow (`.github/workflows/release.yml`)
either:

1. opens/updates a **"Version Packages"** PR that consumes the pending
   changesets, bumps `@open-visual-regression/cli`'s version, and updates its changelog; or
2. if that PR is already merged (no pending changesets, a new version to
   publish), runs `pnpm release` to publish `@open-visual-regression/cli` to npm and push its
   `@open-visual-regression/cli@X.Y.Z` git tag.
