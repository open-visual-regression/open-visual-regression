---
"@ovr/web": minor
"@ovr/worker": minor
---

Remove the chart's global `image.digest`.

`web` and `worker` are different images and cannot share a digest, so a value
set there produced a valid manifest pointing at the wrong image for at least
one of them. Digests are pinned per component instead, with `web.image.digest`
and `worker.image.digest`, which already existed and are unchanged.

This is breaking for anyone setting `image.digest`. The values schema rejects
the key, so an upgrade fails with a schema error rather than quietly deploying
an unpinned image. Global `image.registry`, `image.tag` and `image.pullPolicy`
are unaffected.
