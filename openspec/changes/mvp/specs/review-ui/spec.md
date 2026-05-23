## ADDED Requirements

### Requirement: Builds list
Authenticated users SHALL be able to view a list of builds for a project, showing build status, branch, commit SHA, triggered-by user, and creation time. The list SHALL be sorted by most recent first.

#### Scenario: View builds
- **WHEN** an authenticated user navigates to a project's builds page
- **THEN** all builds are listed with status, branch, commit SHA, and timestamp

#### Scenario: Build status indicators
- **WHEN** a build has status `passed`, `needs_review`, `pending`, or `error`
- **THEN** the status is visually indicated with a distinct color or icon

### Requirement: Build detail
Authenticated users SHALL be able to view a build's detail page showing all snapshots grouped by status, with counts for auto-approved, needs-review, and error states.

#### Scenario: Build overview
- **WHEN** an authenticated user opens a build
- **THEN** they see summary counts: total snapshots, auto-approved, needs review, errors

#### Scenario: Snapshot list filtered by status
- **WHEN** a user filters the snapshot list by `needs_review`
- **THEN** only snapshots with diffs requiring review are shown

### Requirement: Diff viewer
Authenticated users SHALL be able to view individual diffs with three comparison modes selectable from the toolbar: side-by-side, overlay, and slider. The diff canvas background SHALL show the pixel-grid texture. Any console output or render errors captured during the story render SHALL be accessible from the diff view.

#### Scenario: Side-by-side view
- **WHEN** a user opens a diff in side-by-side mode
- **THEN** the baseline and current capture are shown at equal scale side-by-side. The baseline panel shows `remove` diff regions; the current panel shows `change` and `add` regions. Each panel has a label (BASELINE / CURRENT) and a sub-label showing branch and commit SHA.

#### Scenario: Overlay view
- **WHEN** a user switches to overlay mode
- **THEN** a single full-width frame shows the current capture with all diff regions overlaid simultaneously.

#### Scenario: Slider view
- **WHEN** a user switches to slider mode
- **THEN** a draggable vertical divider separates baseline (left) from current (right). Dragging the handle updates the clip boundary in real time. The divider is 2px amber with a square amber handle showing `↔`.

#### Scenario: Diff overlay toggle
- **WHEN** a user clicks the eye/eyeOff button
- **THEN** the diff region rectangles (colored at 40% opacity with 2px outline) are shown or hidden. The toggle persists across mode changes within the same diff session.

#### Scenario: No baseline (new story)
- **WHEN** a user views a diff with no baseline
- **THEN** a dedicated no-baseline state is shown indicating this is a new story with no prior capture, and the user can approve to establish the first baseline.

#### Scenario: Render error flagged
- **WHEN** a snapshot has a render error
- **THEN** the diff view displays a prominent error indicator and a panel showing the captured console logs and error output.

#### Scenario: Render logs visible
- **WHEN** a snapshot has captured console output
- **THEN** the logs are accessible from the diff view in a collapsible panel.

### Requirement: Diff viewer keyboard shortcuts
The diff viewer SHALL support keyboard shortcuts for efficient review without mouse interaction.

#### Scenario: Navigate between diffs
- **WHEN** a user presses `J`
- **THEN** the next changed snapshot in the run is opened. When `K` is pressed, the previous changed snapshot is opened. The footer shows `N of M changed` with these hints.

#### Scenario: Approve / reject via keyboard
- **WHEN** a user presses `A`
- **THEN** the current diff is approved. When `R` is pressed, it is rejected. Keyboard hints are shown in the diff viewer footer alongside prev/next buttons.

### Requirement: Approve diff
Any authenticated user SHALL be able to approve a diff. Approving SHALL update the Diff status to `approved` and record the reviewer's identity and timestamp.

#### Scenario: Approve diff
- **WHEN** a user clicks approve on a diff with status `needs_review`
- **THEN** the Diff status is updated to `approved`, the reviewer and timestamp are recorded, and the build status is recalculated

#### Scenario: Build passes after all diffs approved
- **WHEN** the last `needs_review` diff in a build is approved
- **THEN** the Build status updates to `passed`

#### Scenario: Approve already-approved diff
- **WHEN** a user approves a diff that is already approved
- **THEN** the action is idempotent — no error, status remains `approved`

### Requirement: Reject diff
Any authenticated user SHALL be able to reject a diff. Rejecting SHALL update the Diff status to `rejected` and record the reviewer's identity and timestamp.

#### Scenario: Reject diff
- **WHEN** a user clicks reject on a diff
- **THEN** the Diff status is updated to `rejected`, the reviewer and timestamp are recorded, and the build status reflects the rejection

#### Scenario: Build remains needs_review after rejection
- **WHEN** a diff is rejected
- **THEN** the Build status is `needs_review` (not `passed`)

### Requirement: Run detail visual summary
The run detail page SHALL show a segmented progress bar summarising snapshot status counts before the snapshot grid.

#### Scenario: Segmented progress bar
- **WHEN** a user views a run detail page
- **THEN** a segmented horizontal bar shows proportional counts of pass (green), changed (amber), failed (red), and pending (blue) snapshots with a summary text showing completion ratio.

### Requirement: Bulk approve / reject
Authenticated users SHALL be able to approve or reject all changed snapshots in a run with a single action from the run detail header.

#### Scenario: Approve all changed
- **WHEN** a user clicks "approve all" on a run with `needs_review` diffs
- **THEN** all `needs_review` diffs in the run are approved and the build status updates accordingly.

#### Scenario: Reject all changed
- **WHEN** a user clicks "reject all"
- **THEN** all `needs_review` diffs are rejected.

### Requirement: Build status polling
While a build is in progress, the review UI SHALL automatically poll for status updates so users see live progress without manual refresh.

#### Scenario: In-progress build polling
- **WHEN** a user views a build with status `pending` or `running`
- **THEN** the page polls for status updates every 5 seconds and updates the UI when the status changes

#### Scenario: Polling stops on terminal state
- **WHEN** a build reaches a terminal state (`passed`, `needs_review`, `error`)
- **THEN** polling stops
