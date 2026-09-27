---
"@ovr/capture": patch
"@ovr/worker": patch
---

Fix a superseded build occasionally continuing to capture snapshots after being canceled, which could slow down or destabilize the build that superseded it.
