---
"@ovr/api": minor
"@ovr/db": minor
---

Let `builds.list` filter by commit SHA.

Adds a `commitShas` filter alongside the existing `branches` and `authors`
filters, so a caller that already knows a commit (an agent in a repo
checkout, say) can look up its build directly instead of filtering client-side
through a full branch listing.
