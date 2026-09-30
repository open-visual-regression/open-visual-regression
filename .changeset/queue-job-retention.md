---
"@ovr/web": patch
"@ovr/worker": patch
---

Finished queue jobs are now removed from Redis after an hour (failed ones after a week), instead of being kept forever and eventually exhausting Redis memory.
