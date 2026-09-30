---
"@ovr/web": patch
---

The login page no longer queries the database on every visit once setup is complete, and signed-in sessions are re-checked against the database every 5 minutes instead of every minute. Idle deployments on scale-to-zero databases stay asleep longer.
