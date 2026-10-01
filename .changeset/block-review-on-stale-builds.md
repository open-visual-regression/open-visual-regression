---
"@ovr/web": patch
"@ovr/api": patch
"@ovr/builds": patch
"@ovr/reviews": patch
---

Enforce review rules on the server instead of only hiding buttons. Voting on a snapshot is refused once a newer build has landed on the branch or the snapshot failed, and approving or rejecting a whole build is also refused while it is running, canceled, or errored. Build and snapshot details now expose `isReviewable` so the UI shows the review buttons only when a vote would be accepted.
