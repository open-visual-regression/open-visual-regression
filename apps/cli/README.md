# @open-visual-regression/cli

CLI for [Open Visual Regression](https://github.com/open-visual-regression/open-visual-regression). Uploads a build to an OVR server and reports the result.

## Install

```sh
npm install -D @open-visual-regression/cli
```

Or run it without installing via `npx @open-visual-regression/cli`.

## Authentication

Every command requires `OVR_API_KEY`, a project-scoped key created from the project's settings page in OVR.

```sh
export OVR_API_KEY=...
```

## Config

An `ovr.config.ts` (or `.js`/`.mjs`) file in the directory you run the CLI from controls capture viewports and the diff threshold:

```ts
// ovr.config.ts
import { defineConfig } from "@open-visual-regression/cli/config";

export default defineConfig({
  viewports: [
    { name: "desktop", width: 1280 },
    { name: "mobile", width: 375, browser: "webkit" },
  ],
  defaultViewports: ["desktop"],
  diffThreshold: 0.05,
});
```

### `ovr.config.ts` options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `viewports` | `Viewport[]` | `[]` | Every viewport available, named or not |
| `defaultViewports` | `string[]` | every named viewport | Names from `viewports` captured automatically for every story |
| `diffThreshold` | `number`, `(0, 1]` | `0.05` | Fraction of pixels that may differ before a snapshot needs review |

### `Viewport` fields

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `name` | `string` | | References this viewport from `defaultViewports` or a story override |
| `browser` | `"chromium" \| "firefox" \| "webkit"` | `"chromium"` | |
| `width` | `number` | | |
| `height` | `number` | full page | Omit to capture the full page height instead of a fixed crop |

Unnamed viewports (no `name`) are always opt-in: they can't be referenced by `defaultViewports`, only added inline via a story override.

## Storybook

Requires a Storybook 8.5+ static build (`storybook build`). Older builds are rejected up
front: before 8.5 the Storybook preview does not emit the `storyFinished` event that the
capture step waits on, so stories would time out one by one instead of failing fast.

### Usage

```sh
ovr snapshot storybook \
  --dir storybook-static \
  --server-url https://ovr.example.com \
  --branch "$BRANCH" \
  --commit "$COMMIT_SHA" \
  --name "$(git log -1 --pretty=%s)" \
  --author "$(git log -1 --pretty=%an)"
```

### Flags

| Flag | Required | Default | Description |
|------|----------|---------|-------------|
| `-d, --dir <path>` | yes | | Path to the Storybook static build output |
| `--server-url <url>` | yes | | OVR server URL |
| `--branch <name>` | yes | | Branch name |
| `--commit <sha>` | yes | | Commit SHA |
| `--name <name>` | no | | Build name, e.g. the commit message |
| `--author <author>` | no | | Commit author |
| `--wait` | no | `false` | Wait for the build to finish processing before exiting |
| `--timeout <seconds>` | no | `600` | Maximum seconds to wait for the build result (with `--wait`) |
| `-c, --config <path>` | no | auto-detected | Path to `ovr.config.ts`/`.js`/`.mjs` |

The command uploads the build, then prints the build page URL and exits `0` as soon as the build is published — it doesn't wait for processing or review. Pass `--wait` to block until the build resolves or `--timeout` elapses instead; exit code then reflects the outcome: `0` if the build passed (unchanged or auto-approved), non-zero if it needs review, failed, or timed out.

### Per-story overrides

Set `parameters.ovr` on a story to override the config for that story only:

```tsx
// Button.stories.tsx
export const Primary: Story = {
  parameters: {
    ovr: {
      viewports: ["mobile", { width: 1440 }],
      diffThreshold: 0.02,
    },
  },
};
```

| Field | Type | Description |
|-------|------|-------------|
| `viewports` | `(string \| { browser?, width, height? })[]` | Replaces (not merges with) the config's default viewport list for this story only. String entries reference a `name` from `ovr.config.ts`; object entries define a one-off viewport inline |
| `diffThreshold` | `number` | Replaces the config's `diffThreshold` for this story only |
| `skip` | `boolean` | Skips this story entirely; no snapshots are taken |

## CI example

```yaml
- name: Build Storybook
  run: pnpm build-storybook

- name: Snapshot with OVR
  env:
    OVR_API_KEY: ${{ secrets.OVR_API_KEY }}
  run: |
    npx @open-visual-regression/cli snapshot storybook \
      --dir storybook-static \
      --server-url https://ovr.example.com \
      --branch "${{ github.head_ref || github.ref_name }}" \
      --commit "${{ github.event.pull_request.head.sha || github.sha }}" \
      --name "$(git log -1 --pretty=%s)" \
      --author "$(git log -1 --pretty=%an)"
```

See [`.github/workflows/ci.yml`](https://github.com/open-visual-regression/open-visual-regression/blob/main/.github/workflows/ci.yml) in this repo for the full workflow this is adapted from.

## License

[Elastic License 2.0](https://github.com/open-visual-regression/open-visual-regression/blob/main/LICENSE). Full docs at [docs.openvisualregression.com](https://docs.openvisualregression.com).
