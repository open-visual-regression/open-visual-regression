---
"@open-visual-regression/cli": minor
---

Add `ovr diffs compare`.

Checking whether a change fixes a visual regression meant pushing a build and
waiting for the server to capture and diff it, even when the two images were
already sitting on disk.

`ovr diffs compare <baseline> <capture>` runs the same pixel diffing the server
runs, via the shared `@ovr/image-diff` package rather than a reimplementation, so
its verdict matches what a build would decide. It writes the diff mask with
`--out`, takes the threshold from `ovr.config` (or `--threshold`), and exits
non-zero when the difference exceeds it, so it can gate a script. It talks to no
server and needs no `OVR_API_KEY`.
