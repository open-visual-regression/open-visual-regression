---
"@open-visual-regression/cli": patch
"@ovr/storybook-compat": minor
---

Document `parameters.ovr` on the docs site, covering where parameters can be set
and what `skip` does to a story's baselines.

`@ovr/storybook-compat/parameters` now holds the type the worker resolves. The
CLI still declares its own, since it can't depend on a private package, and a
type test fails the build if the two diverge.
