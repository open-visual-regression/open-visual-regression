---
"@open-visual-regression/cli": patch
"@ovr/storybook-compat": patch
---

`--only-affected` no longer captures every story in some Rspack and Webpack Storybooks when a changed file is imported by a single story file.
