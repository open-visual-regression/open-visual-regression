---
"@open-visual-regression/cli": minor
"@ovr/worker": minor
"@ovr/web": minor
"@ovr/api": patch
"@ovr/builds": patch
"@ovr/capture": patch
"@ovr/capture-browser": patch
"@ovr/db": patch
"@ovr/queue": patch
"@ovr/storybook-compat": patch
---

Captures load external hosts again by default, and blocking them is now opt-in. Since 0.16.1, captures have blocked every external host, including requests a service worker like msw passes through to the network, so stories that load images or web fonts from a remote host captured spinners, broken images, or fallback fonts. To block external requests, set `blockExternalRequests` in `ovr.config.ts`: `true` blocks every host outside the Storybook build, and `{ allow: ["images.example.com", "*.cdn.example.com"] }` blocks every host but those. Override it for one story with `parameters.ovr.blockExternalRequests`. When a capture blocks a request, the snapshot's logs get one warning naming each blocked host.
