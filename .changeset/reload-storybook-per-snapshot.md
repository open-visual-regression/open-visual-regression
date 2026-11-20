---
"@ovr/capture": patch
"@ovr/web": patch
"@ovr/worker": patch
---

Storybook loads afresh for every snapshot, so a story no longer picks up mocks or state left by the story captured before it. Captures take longer, and snapshots affected by that leftover state may change once.
