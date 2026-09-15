---
"@ovr/db": patch
---

Return a build's snapshots in a stable order.

`snapshots.findByBuild` had no `ORDER BY`, so Postgres was free to return a
build's rows in any order. Capture groups are chunked straight out of that
list, so which snapshots shared a warm browser — and in what sequence — could
change between runs of the same build. Stories that load images or make
network requests captured differently depending on whether they landed on a
cold or an already-warm page, which showed up as snapshots flipping between
loaded and unloaded content.

Snapshots now come back ordered by story, browser, and viewport, which also
puts a story's viewports next to each other in the same capture group.
