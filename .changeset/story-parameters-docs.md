---
"@open-visual-regression/cli": patch
"@ovr/storybook-compat": minor
---

Document `parameters.ovr` properly and keep its two type declarations in sync.

The per-story overrides were only documented in the CLI readme, and `skip` in
one line that didn't say what it does to baselines or to a story that fails to
load. The docs site now has a page for them, and both it and the readme cover
setting parameters at component and project level.

The type behind them was declared twice — once in the worker, once in the CLI —
with nothing tying them together, so a field added to one would be silently
ignored by the other. `@ovr/storybook-compat/parameters` now holds the canonical
type the worker resolves; the CLI still declares its own (it ships to npm and
can't depend on a private package), and a type test fails the build if the two
ever drift apart.
