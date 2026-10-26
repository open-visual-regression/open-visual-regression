---
"@ovr/capture-browser": patch
"@ovr/capture": patch
"@ovr/worker": patch
"@open-visual-regression/cli": patch
---

Since 0.16.1, captures block every external host, including requests a service worker like msw passes through to the network, which earlier versions let through. Stories that load images or web fonts from a remote host have captured spinners, broken images, or fallback fonts since then. Captures can now load specific hosts: list them in `OVR_CAPTURE_ALLOWED_HOSTS` on the worker (Helm: `worker.capture.allowedHosts`), like `images.example.com,fonts.gstatic.com,*.cdn.example.com`, and in `capture.allowedHosts` in `ovr.config` or `--allowed-hosts` for `ovr capture storybook`. Every other host stays blocked. A snapshot that requests a blocked host now gets one warning in its logs that names the host. See the External hosts page in the self-hosting docs.
