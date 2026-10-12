---
"@ovr/db": patch
"@ovr/worker": patch
---

Stop a database migration from stalling the running app while it waits for a table lock. A migration now gives up on a lock after 5 seconds and retries, instead of waiting indefinitely while every other query on that table queues behind it.
