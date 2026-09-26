---
"@ovr/storybook-compat": minor
---

Add `findAffectedStories`, which traces changed files through a Storybook
build's module graph (`preview-stats.json`) to the stories they can affect.

It only traces JavaScript and TypeScript and captures every story whenever a
change is outside what it can explain: Storybook or build configuration,
lockfiles, modules the preview loads, and non-code files in packages the bundle
uses. The Storybook fixtures are now built with `--stats-json` so the tracer is
exercised against real Storybook 8, 9 and 10 builds.
