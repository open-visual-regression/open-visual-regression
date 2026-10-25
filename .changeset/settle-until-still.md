---
"@ovr/capture-browser": patch
"@ovr/capture": patch
"@ovr/worker": patch
"@open-visual-regression/cli": patch
---

Captures wait until the network and the page's DOM are both quiet, and until loaded images are decoded, before taking a screenshot. A story that renders in waves, like a response that renders a component which makes its own request, no longer gets captured halfway. A story whose DOM never stops changing gives up after two seconds instead of using its whole settle budget.
