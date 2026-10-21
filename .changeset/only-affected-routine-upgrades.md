---
"@open-visual-regression/cli": minor
"@ovr/storybook-compat": minor
"@ovr/api": patch
"@ovr/builds": patch
"@ovr/db": patch
"@ovr/mocks": patch
"@ovr/web": patch
---

`upload storybook --only-affected` no longer captures every story after a routine upgrade. It now compares these files with the main-branch build's commit instead of treating any change as global. The project's own `ovr.config` only captures everything when its viewports or `waitForTimeout` changed. A bundled package's `package.json` only does when a field the bundler reads changed (`dependencies`, `peerDependencies`, `optionalDependencies`, `exports`, `main`, `module`, `browser`, `imports` or `sideEffects`), not `devDependencies`. A lockfile only does when a package the Storybook bundles, or a tool that builds it, resolved to another version. Add your own build-time packages with the new `onlyAffected.buildDependencies` option. When the CLI does capture every story, the reason is recorded on the build and shown on its page.
