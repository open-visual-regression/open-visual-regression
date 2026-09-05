---
"@ovr/web": patch
---

Fit tall snapshots into the space left on screen instead of running them off the bottom of it.

A snapshot taller than it is wide — a mobile viewport most of all — was rendered
at the full width of its pane, which left it several screens tall with only a
sliver of it visible in the split and slider views. An image box now takes the
height that is left below the page header and centres its snapshot, scaled to
fit. The boxes keep the full width of their pane, and every image in a
comparison is held to the same width, so the baseline, the new snapshot, and the
diff overlay stay at one scale.

This applies from the `lg` breakpoint up, where there is width to trade for
height; a narrower screen keeps the full width snapshot and scrolls.
