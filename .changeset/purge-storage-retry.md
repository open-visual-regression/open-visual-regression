---
"@ovr/worker": patch
"@ovr/builds": patch
---

The nightly purge now retries failed object storage deletes within minutes, with backoff, so purged builds' files no longer wait until the next night after a brief storage outage.
