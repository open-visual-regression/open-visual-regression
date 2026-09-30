---
"@open-visual-regression/cli": patch
"@ovr/web": patch
"@ovr/worker": patch
---

Retrying `ovr upload` after a network error no longer creates a duplicate build that cancels the first one.
