---
"@ovr/capture": patch
---

Wait for a story's images and network requests before screenshotting it.

Capture gated the screenshot on Storybook's `storyFinished` event, which fires
once the component has rendered — it says nothing about whether an `<img>` has
loaded or a `fetch` in an effect has resolved. Stories that load images or call
an API were screenshotted mid-flight, so the same story could come out with its
content one run and a skeleton the next.

Capture now adds a settle phase between the render and the screenshot: it waits
for the page's in-flight requests to go quiet, for webfonts to be ready, and for
the resulting paint to land. The phase is bounded, so a story that never goes
quiet is still captured rather than failed, and its time shows up alongside the
existing render and screenshot timings.
