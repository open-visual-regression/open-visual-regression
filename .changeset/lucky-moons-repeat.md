---
"@ovr/web": patch
"@ovr/worker": patch
"@ovr/capture": patch
"@ovr/builds": patch
"@ovr/db": patch
"@ovr/api": patch
---

Only mark a snapshot errored when the story itself failed to render.

An uncaught exception seen through Playwright's `pageerror` event was folded
into `hasRenderError`, alongside the render and play failures Storybook reports
over its own channel. A story that rendered correctly and then threw — an error
a boundary already recovered from, or one raised from a timer after the story
finished — was marked errored, skipped its diff, and failed its build, even
though its screenshot was perfectly usable.

`hasRenderError` now comes only from Storybook's render and play result. The
`pageerror` signal is kept separately as `hasUncaughtPageError`, which leaves
the snapshot diffable and raises a warning on it instead. A snapshot also
records the reason it errored in `errorMessage`, so it names what went wrong
rather than always reading "This snapshot failed to capture", and a build whose
snapshots errored says so instead of reporting a failure to diff against a
baseline.
