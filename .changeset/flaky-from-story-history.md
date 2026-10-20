---
"@ovr/api": patch
"@ovr/capture": patch
"@ovr/db": patch
"@ovr/web": patch
"@ovr/worker": patch
---

A snapshot is now flaky only when its story is flagged by flaky detection, so pull request builds and main-branch builds show the same snapshots as flaky. Pull request builds no longer mark a change as flaky just because it matches an earlier main-branch screenshot of the story, which also flagged real changes such as branches cut before a redesign. `flags[].matchesEarlierVariant` is deprecated and always false.
