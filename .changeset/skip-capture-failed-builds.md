---
"@ovr/builds": patch
"@ovr/capture": patch
"@ovr/db": patch
"@ovr/worker": patch
---

Capture and diff workers no longer spend time on builds that have already errored or been canceled. A queued capture group for such a build finishes without downloading the Storybook bundle or launching a browser, snapshots the build reaper already errored are no longer captured, and reaping a build now removes its waiting capture and diff jobs from the queue. Snapshots the reaper errors now get an errored diff, so retrying some of them lets the build settle instead of waiting to be reaped again.
