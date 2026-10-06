---
"@ovr/api": minor
"@ovr/builds": minor
"@ovr/db": minor
"@ovr/queue": minor
"@ovr/ui": patch
"@ovr/web": minor
"@ovr/worker": patch
---

Show when flaky detection last ran and add a "run now" button to the jobs page. Running saves any unsaved changes first, so it runs with the settings on screen. The button is disabled with a spinner while a run is in progress, and the page refreshes until the run finishes. Starting a run is refused when flaky detection is disabled or already running.
