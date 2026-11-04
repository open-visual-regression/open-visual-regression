---
"@open-visual-regression/cli": minor
"@ovr/web": minor
"@ovr/worker": minor
"@ovr/api": patch
"@ovr/builds": patch
"@ovr/capture": patch
"@ovr/reviews": patch
"@ovr/ui": patch
---

Branch builds are compared against main at their merge base, so changes main made after the branch was cut no longer show up as the branch's own. This needs the full git history (`fetch-depth: 0`).
