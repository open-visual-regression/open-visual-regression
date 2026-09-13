---
"@ovr/capture": patch
---

Finalize a build when every story is skipped.

A build whose stories all set `parameters.ovr.skip` created no snapshots, and
with no snapshots there are no diffs to finalize it, so it stayed in
`processing` until the reaper timed it out. Extract now finalizes such a build
directly and it resolves as unchanged.
