---
"@open-visual-regression/cli": minor
"@ovr/storybook-compat": minor
"@ovr/api": patch
"@ovr/builds": patch
"@ovr/db": patch
"@ovr/mocks": patch
"@ovr/web": patch
---

`upload storybook --only-affected` no longer captures every story after changes that can't affect them, like a CLI upgrade, and the build page shows why when it does.
