---
"@ovr/capture": patch
"@ovr/worker": patch
---

Compare screenshots in a background thread so diffing no longer stalls captures, and keep recently read screenshots and baselines on local disk so a diff skips downloading the screenshot the worker just captured and a baseline it has already read. `OVR_IMAGE_CACHE_BYTES` (Helm: `worker.imageCacheBytes`) caps the cache, 512 MB by default.
