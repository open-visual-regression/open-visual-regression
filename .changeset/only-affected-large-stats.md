---
"@open-visual-regression/cli": patch
"@ovr/storybook-compat": patch
---

`upload storybook --only-affected` reads `preview-stats.json` files larger than 512 MB, and says when one can't be parsed instead of calling it missing.
