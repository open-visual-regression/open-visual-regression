---
"@ovr/web": minor
"@ovr/worker": minor
---

**Breaking:** The Helm chart reads only its documented keys from the Secret, by name, instead of loading every key into the environment. If you use `existingSecret`:

- Keys you added beyond the documented ones no longer reach OVR.
- Pods won't start until the Secret has `DATABASE_URL`, `REDIS_URL`, `BETTER_AUTH_SECRET` and `OVR_GIT_TOKEN_ENCRYPTION_KEY`. Separate `DATABASE_*` variables aren't read.
