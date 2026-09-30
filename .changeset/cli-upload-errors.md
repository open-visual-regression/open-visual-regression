---
"@open-visual-regression/cli": patch
---

`ovr upload` now says which step failed and why, logs each retry, and gives up on a request with no response after 60 seconds.
