---
"@ovr/db": patch
---

Index `snapshot_logs.snapshot_id`.

The snapshot page loads a snapshot's logs by `snapshot_id`, which had no index,
so every load scanned the whole `snapshot_logs` table and slowed down as it
grew. Deleting snapshots, which cascades to their logs, scanned it too.
