---
"@ovr/web": patch
---

Choose what an api key is allowed to do when you create it.

Every api key could only ever upload a build, so there was nothing to choose.
Reading builds and voting on reviews are becoming things a key can do, and a
key that uploads from CI has no business approving a diff, so creating one now
asks which of the three it is for: ci upload, an agent that only reads, or an
agent that reads and reviews. The keys table reports what each key is allowed
to do, since a list of keys that no longer do the same thing is not much use
without it. Existing keys keep uploading builds and nothing else.
