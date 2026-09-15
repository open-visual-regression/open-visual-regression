---
"@ovr/capture": patch
---

Re-render a story Storybook reports as unchanged.

A story captured at more than one viewport is asked for twice on the same page.
The second request made Storybook emit `storyUnchanged`, which capture treated
as a successful render — so the screenshot was taken with no re-render, no play
function, and no settling time after the viewport resize. Responsive images and
anything the resize kicked off were caught mid-flight, which is why a story
could look right at one viewport and unloaded at another.

Capture now forces a remount when Storybook reports the story unchanged, so
every snapshot waits on a real render and its play function regardless of what
the page was showing before.
