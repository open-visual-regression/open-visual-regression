---
"@ovr/web": minor
---

The snapshot history API now starts at the given snapshot and pages through older and newer builds with a cursor. Each entry includes its image path and flags, and the response points to the newest snapshot like it on the branch.
