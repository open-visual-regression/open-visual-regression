---
"@ovr/web": minor
---

Turn on Cache Components and Partial Prefetching. Each page now has a prerendered shell, so links load their page's skeleton ahead of the click and navigation shows it right away while the data streams in. Links to the same kind of page share one prefetch instead of one per link.
