---
"@ovr/logger": patch
"@ovr/web": patch
"@ovr/worker": patch
---

Logs now show the level as a name, such as `"level":"error"`, instead of a number such as `"level":50`. Log tools such as Datadog can now read the severity.
