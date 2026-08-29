---
"@ovr/web": patch
---

Route better-auth's logs through the shared application logger.

better-auth wrote to its own console logger, so its output ignored `LOG_LEVEL`
and did not match the structured format everything else emits. It now goes
through `@ovr/logger` like the rest of the app.
