---
"@ovr/db": patch
"@ovr/git-status": patch
"@ovr/web": patch
"@ovr/worker": patch
---

Git integrations now record how they authenticate: with a project access token, or through a connection the instance manages, such as a GitHub App. Existing integrations keep working as access token integrations.
