---
"@ovr/web": patch
"@ovr/worker": patch
---

Upgrade better-auth to 1.7.6. Better Auth 1.7.3 stopped writing the `account.issuer` column that 1.7.0–1.7.2 required, so this release's migration drops the column's unique index and makes it nullable. The column itself is kept for now, so a previous release can still sign users in during a rolling deploy or after a rollback; it will be removed in a later release.
