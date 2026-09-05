---
"@ovr/web": patch
---

Fit tall snapshots into the space left on screen instead of running them off the bottom of it.

A snapshot taller than it is wide — a mobile viewport most of all — was rendered
at the full width of its pane, which left it several screens tall with only a
sliver of it visible in the split and slider views. From the `lg` breakpoint up,
each pane now takes the height left below the page header and scales its
snapshot to fit, centred on the dotted backdrop, which keeps its full width. A
narrower screen keeps the full width snapshot and scrolls.
