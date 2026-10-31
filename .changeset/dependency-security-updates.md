---
"@ovr/web": patch
"@ovr/worker": patch
"@ovr/db": patch
---

Updates Next.js, Better Auth, and other dependencies to fix security advisories. A migration makes the `account.issuer` column, which Better Auth no longer uses, nullable.
