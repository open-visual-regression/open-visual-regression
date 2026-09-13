---
"@open-visual-regression/cli": minor
---

Let `ovr.config` set a default server URL.

`snapshot storybook`, `builds list`, and `builds get` all required
`--server-url` on every invocation. `ovr.config` can now set a `serverUrl`
used whenever the flag is omitted; passing `--server-url` still overrides it.
