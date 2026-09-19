---
"@open-visual-regression/cli": minor
---

Filter and paginate `builds list`.

The command only ever returned the first twenty builds and dropped the server's
next-page cursor, so there was no way to reach an older build from the CLI, and
it exposed two of the filters the API accepts. It now takes `--status`,
`--author` and `--search` as well, `--branch` and `--commit` accept several
values apiece, `--sort` picks the direction, and `--limit`, `--cursor` and
`--all` walk the pages. A status the server does not recognize is rejected
before the request is sent, and an empty result reports the filters that
produced it so a mistyped branch or author is visible rather than silent.

`--json` now prints `{ builds, total, nextCursor }` instead of a bare array,
since the page alone cannot say whether more builds match or where to resume.
