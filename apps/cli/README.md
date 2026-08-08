# @open-visual-regression/cli

CLI for [Open Visual Regression](https://github.com/open-visual-regression/open-visual-regression). Uploads a Storybook build to an OVR server and reports the result.

## Install

```sh
npm install -D @open-visual-regression/cli
```

Or run it without installing via `npx @open-visual-regression/cli`.

## Usage

Requires a Storybook v7+ static build (`storybook build`) and a project API key, created from the project's settings page in OVR.

```sh
export OVR_API_KEY=...
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
| `--timeout <seconds>` | no | `600` | Maximum seconds to wait for the build result |
| `-c, --config <path>` | no | auto-detected | Path to `ovr.config.ts`/`.js`/`.mjs` |

The command uploads the build, then polls until it resolves or `--timeout` elapses. Exit code reflects the outcome: `0` if the build passed (unchanged or auto-approved), non-zero if it needs review, failed, or timed out.

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

- `viewports`: every viewport available. `browser` defaults to `chromium`; omit `height` to capture the full page instead of a fixed crop.
- `defaultViewports`: names from `viewports` captured automatically for every story. Omit to default to every named viewport.
- `diffThreshold`: fraction of pixels that may differ before a snapshot needs review, `(0, 1]`. Defaults to `0.05`.

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

`viewports` here replaces (not merges with) the config's default list; string entries reference a name from `ovr.config.ts`, object entries define a one-off viewport inline. Set `skip: true` to exclude a story entirely.

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

## License

[Elastic License 2.0](https://github.com/open-visual-regression/open-visual-regression/blob/main/LICENSE). Full docs at [docs.openvisualregression.com](https://docs.openvisualregression.com).
