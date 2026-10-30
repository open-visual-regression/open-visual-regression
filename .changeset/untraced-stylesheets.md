---
"@open-visual-regression/cli": patch
---

`--only-affected` ignores a changed stylesheet (`.css`, `.scss`, `.sass`, `.less`, `.styl`, `.pcss`) that no story imports, instead of capturing every story when it is in a package the Storybook bundles.
