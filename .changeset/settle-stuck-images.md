---
"@ovr/worker": patch
"@ovr/web": patch
"@open-visual-regression/cli": patch
"@ovr/capture-browser": patch
---

Stories that show the same image from a host that never finishes responding no longer each wait out the full settle time. Once capture gives up on the image, later stories skip it.
