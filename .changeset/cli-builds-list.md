---
"@open-visual-regression/cli": minor
---

Add `ovr builds list [--branch <name>] [--commit <sha>]`.

The CLI only had write-side commands (`snapshot storybook`, upload + poll).
This lets an agent in a repo checkout ask what OVR thinks about the code it's
looking at, from a terminal, using a personal access token instead of relying
on a human to check the web UI.
