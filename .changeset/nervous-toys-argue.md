---
"@open-visual-regression/cli": minor
"@ovr/worker": minor
---

Require Storybook 8.5 or newer.

Older builds were never captured correctly — they failed partway through
processing, after the upload, once per story. They are now rejected up front:
`ovr snapshot storybook` reports the problem before uploading, and the server
refuses the build before starting work on it. The error names the version it
found.
