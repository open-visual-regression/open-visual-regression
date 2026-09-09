---
"@open-visual-regression/cli": patch
---

Stop the published CLI from depending on an unpublished package.

`@ovr/storybook-compat` is an internal, private package, but the CLI declared it
as a runtime dependency. On publish `workspace:*` is rewritten to a version no
registry has, so `npm install @open-visual-regression/cli` failed to resolve it.
The CLI already bundles that code with tsup, the same way it bundles `@ovr/api`,
so the dependency is now a devDependency and installs resolve cleanly. Nothing
about the bundled output or the commands changes.
