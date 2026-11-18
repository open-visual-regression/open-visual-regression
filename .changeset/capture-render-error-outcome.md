---
"@ovr/web": minor
"@ovr/worker": minor
"@ovr/capture": patch
"@ovr/capture-browser": patch
---

`ovr_snapshots_captured_total` counts snapshots whose page failed, such as a failing interaction, as `render_error` instead of `success`. Worker logs include the failure's kind and message, and log render timeouts as warnings.
