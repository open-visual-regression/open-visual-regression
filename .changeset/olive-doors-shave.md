---
"@ovr/web": minor
---

Show the running version in the sidebar, and publish images that match it.

The sidebar read `process.env.npm_package_version`, which the container never sets, so it always fell back to `0.0.0`. It now reads the version from `package.json` at build time.

Images are also published for `linux/arm64` alongside `linux/amd64`, and a release promotes the exact image that passed E2E instead of rebuilding it.
