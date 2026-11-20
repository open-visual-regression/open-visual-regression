---
"@ovr/capture": patch
"@ovr/web": patch
"@ovr/worker": patch
---

Each snapshot loads Storybook afresh, at its own viewport and with cookies and storage cleared, so a story no longer picks up mocks or state from the story captured before it. Captures take longer, and affected snapshots may change once.
