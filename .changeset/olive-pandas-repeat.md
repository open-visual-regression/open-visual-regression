---
"@ovr/web": patch
"@ovr/worker": patch
"@ovr/bull-board": patch
"@ovr/builds": patch
---

Route all remaining logging through the shared application logger.

better-auth wrote to its own console logger, and the worker, the builds
retention module and bull-board wrote to `console` directly. That output
ignored `LOG_LEVEL` and did not match the structured format everything else
emits. It now goes through `@ovr/logger`.

The `ovr` CLI and the database migrate script still write to `console`, since
that output is the program's own interface rather than logging.
