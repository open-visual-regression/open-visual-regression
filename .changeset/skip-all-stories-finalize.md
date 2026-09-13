---
"@ovr/capture": patch
---

Finalize a build when every story is skipped.

A build whose stories all set `parameters.ovr.skip` has no snapshots, and so no
diffs to finalize it. It stayed in `processing` until the reaper timed it out;
it now resolves as unchanged.
