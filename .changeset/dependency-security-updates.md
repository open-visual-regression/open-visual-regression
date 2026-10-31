---
"@ovr/web": patch
"@ovr/worker": patch
"@ovr/db": patch
"@open-visual-regression/cli": patch
---

Update dependencies to resolve security advisories, including Next.js 16.4.3 and Better Auth 1.7.14. Better Auth 1.7.3+ identifies accounts by provider and account ID instead of issuer, so a migration re-keys trusted-proxy accounts as `<issuer>#<subject>` (an identity from another issuer still never signs in as an existing user) and makes the now-unused `account.issuer` column nullable.
