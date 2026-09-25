---
"@ovr/capture": patch
"@ovr/worker": patch
---

Serve captured Storybooks from `http://localhost:<port>` instead of `http://127.0.0.1:<port>`, so stories that build API URLs by swapping in a subdomain get a valid host (`api.localhost`) rather than `api.0.0.1`.
