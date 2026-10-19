---
"@ovr/web": patch
---

The snapshot History tab loads in one request and opens with the snapshot you're viewing centered, instead of flashing an empty message or shifting the list as newer builds arrive. History starts loading when you open the sidebar or hover the tab. `snapshots.getHistory` takes `align: "center"` to return the builds on both sides of the snapshot in its first page.
