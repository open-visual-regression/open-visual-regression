---
"@ovr/web": patch
---

Fit tall snapshots into the space left on screen instead of running them off the bottom of it.

A snapshot taller than it is wide — a mobile viewport most of all — was rendered
at the full width of its pane, which left it several screens tall with only a
sliver of it visible in the split and slider views. A comparison now caps its
panes at the width the tallest of its images needs to fit below the page header,
so the whole snapshot is on screen. Every pane shares that width, so the
baseline, the new snapshot, and the diff overlay stay at one scale.

The cap applies from the `lg` breakpoint up, where there is width to trade for
height; a narrower screen keeps the full width snapshot and scrolls.
