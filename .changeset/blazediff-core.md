---
"@ovr/capture": patch
"@ovr/worker": patch
---

Compare screenshots with `@blazediff/core` instead of `pixelmatch`. It counts the same differing pixels and draws the same diff mask, but skips unchanged images and unchanged regions faster.
