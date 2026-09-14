---
"@open-visual-regression/cli": patch
---

Deduplicate CLI error reporting.

`snapshot storybook`, `builds list`, and `builds get` each repeated the same
ORPCError-vs-generic-error formatting in their catch blocks. Extracted into
`formatCliError`, a pure, tested function shared by all three — no behavior
change.
