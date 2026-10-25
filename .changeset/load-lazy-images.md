---
"@ovr/capture-browser": patch
"@ovr/capture": patch
"@ovr/worker": patch
"@open-visual-regression/cli": patch
---

Captures load `loading="lazy"` images and iframes right away, including ones a story adds after it first renders. Images below the viewport now load while the page settles, instead of partway through a full-page screenshot or not at all.
