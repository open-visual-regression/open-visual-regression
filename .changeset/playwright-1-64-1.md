---
"@ovr/worker": patch
"@ovr/capture": patch
"@ovr/capture-browser": patch
"@open-visual-regression/cli": patch
---

Upgrade Playwright to 1.64.1. The worker image now runs on Node.js 24.22.1, which includes the October 2026 Node.js security fixes; it was previously still on 24.16.0 from the older Playwright base image. Captures now use Chromium 156, so expect some snapshots to show small rendering differences against existing baselines.
