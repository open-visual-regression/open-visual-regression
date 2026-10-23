---
"@ovr/queue": patch
"@ovr/worker": patch
---

Round-robin capture no longer leaves a build's WebKit or Firefox groups waiting until every other build's Chromium groups have run. Each browser's groups now take their own turns, and a capture group that is retried runs before groups still waiting for their first turn, so it no longer leaves a snapshot processing behind them.
