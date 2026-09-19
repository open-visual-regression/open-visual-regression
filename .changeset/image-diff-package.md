---
"@ovr/image-diff": minor
"@ovr/capture": patch
---

Extract pixel diffing into an `@ovr/image-diff` package.

The diffing logic lived inside `@ovr/capture`, which depends on Playwright, so
nothing else could reuse it — the CLI would have had to duplicate the algorithm
and risk disagreeing with the verdict the server computed.

`@ovr/image-diff` now owns canvas padding, the pixelmatch call, the diff
percentage and PNG encoding/decoding, depending only on `pixelmatch` and
`pngjs`. `diffImages` takes decoded pixels rather than encoded PNGs so `@ovr/capture`
keeps streaming captures out of object storage exactly as before, including its
read timeout, rather than being forced onto a blocking synchronous parse inside
the worker. Behavior is unchanged: same threshold, same canvas sizing, same
baseline-first comparison order.
