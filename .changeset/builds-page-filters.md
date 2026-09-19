---
"@ovr/web": minor
---

Filter and search the all-builds page at `/builds`.

The status, branch and author dropdowns and the search box that the project
page already had now sit on the all-builds page too, where their options span
every project in the organization rather than a single one. Filters read from
and write to the url, so a filtered view stays shareable and survives a
reload.

The filters, the search field and their facet popovers move to
`lib/components`, shared by both pages, alongside the list and rows that moved
there earlier.
