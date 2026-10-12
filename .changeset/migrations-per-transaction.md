---
"@ovr/db": patch
"@ovr/worker": patch
---

Apply each database migration in its own transaction instead of all pending migrations in one, so upgrading across several releases no longer deadlocks with the running web and worker pods. Only one migrator runs at a time.
