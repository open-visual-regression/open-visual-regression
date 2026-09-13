---
"@ovr/capture": patch
---

Finalize a build when every story opts out with `parameters.ovr.skip`.

Skipping a story creates no snapshot for it, so a build where every story is
skipped created none at all. Nothing was captured and no diff ran, which left
the build with no diff-completion check to finalize it: it sat in `processing`
until the reaper timed it out ~30 minutes later and posted a failing commit
status. Extract now enqueues the finalize job itself when a build ends up with
no snapshots, so it resolves immediately as unchanged. Builds with a mix of
skipped and captured stories were never affected.
