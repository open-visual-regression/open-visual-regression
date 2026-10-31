---
"@ovr/capture-browser": patch
"@ovr/capture": patch
"@ovr/worker": patch
"@open-visual-regression/cli": patch
---

Captures wait for images that are still loading and for fonts, even on a story whose DOM never stops changing, such as one with an endless animation, and give pending work up to 15 seconds instead of 5 to settle, so images no longer go missing from snapshots taken under load.
