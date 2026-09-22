---
"@ovr/web": patch
---

Add a rebuild button to the snapshot page.

A reviewer can re-capture a single snapshot without rebuilding the whole
build. The confirmation spells out that the screenshot, logs, diff and any
review on it are replaced, and the button also shows for an errored
snapshot, which has nothing to review.
