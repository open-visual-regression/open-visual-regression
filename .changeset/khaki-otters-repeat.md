---
"@ovr/web": minor
"@ovr/worker": minor
---

Name the migration Job after the app version it migrates to.

The name previously carried `.Release.Revision`, which increments under
`helm upgrade` but is always `1` when the chart is rendered with
`helm template` — so under Argo CD every release reused one name.

`hook-delete-policy: before-hook-creation` deletes the previous Job, and
`hook-succeeded` only removes Jobs that passed. A constant name therefore
destroyed a _failed_ migration, and its pod logs, as soon as the next upgrade
ran. Keying the name to `.Chart.AppVersion` varies per release under both
Helm and `helm template`, so a failed migration survives the upgrade that
follows it.
