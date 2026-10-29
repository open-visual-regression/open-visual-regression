---
"@ovr/api": patch
"@ovr/web": patch
"@ovr/worker": patch
---

Add a provider-agnostic API for git integrations. `gitProviders.list` describes each provider and the credentials a project can use with it, `gitProviders.connections` reports the connections admins have set up, and `gitProviders.searchRepositories` searches the repositories a connection can reach. `gitIntegrations.upsert` takes a `credential` that is either an access token or a connection and repository.
