## ADDED Requirements

### Requirement: CLI snapshot command
The CLI SHALL provide an `ovr snapshot` command that accepts `--storybook-dir` and `--api-key` flags (or reads `OVR_API_KEY` from env) and reads server URL from `ovr.config.ts`.

#### Scenario: Successful invocation
- **WHEN** the user runs `ovr snapshot --storybook-dir ./storybook-static`
- **THEN** the CLI reads `ovr.config.ts`, authenticates with the configured API key, creates a build, and begins polling

#### Scenario: API key from environment
- **WHEN** `OVR_API_KEY` is set in the environment and `--api-key` is not passed
- **THEN** the CLI uses the environment variable value

#### Scenario: Missing API key
- **WHEN** neither `--api-key` nor `OVR_API_KEY` is set
- **THEN** the CLI exits with a clear error message before making any network request

#### Scenario: Missing storybook directory
- **WHEN** `--storybook-dir` points to a path that does not exist
- **THEN** the CLI exits with a clear error message

### Requirement: CLI blocking mode
The CLI SHALL block until the build reaches a terminal state (passed, failed, or needs_review). It SHALL poll the build status API every 5 seconds. It SHALL exit with code `0` on `passed` and code `1` on `failed` or `needs_review`.

#### Scenario: Build passes
- **WHEN** all diffs are within threshold or auto-approved
- **THEN** the CLI prints a success message and exits with code 0

#### Scenario: Build needs review
- **WHEN** one or more diffs require human review
- **THEN** the CLI prints the review URL and exits with code 1

#### Scenario: Build fails
- **WHEN** the build encounters an infrastructure error
- **THEN** the CLI prints an error message and exits with code 1

### Requirement: Build creation
When the CLI triggers a build, the system SHALL create a Build record and Snapshot records (one per story × variant combination). The CLI SHALL also upload the Storybook static build to object storage. The uploaded path SHALL be stored on the Build record for future use.

#### Scenario: Build and snapshot records created
- **WHEN** the CLI calls createBuild with valid auth and a list of stories
- **THEN** a Build record and one Snapshot record per story × variant are created with status `pending`

#### Scenario: Storybook uploaded
- **WHEN** the build is created
- **THEN** the Storybook static build is uploaded to RustFS and the path is stored on the Build record

#### Scenario: Invalid API key
- **WHEN** the CLI calls createBuild with an invalid API key
- **THEN** the request is rejected with UNAUTHORIZED and no records are created

### Requirement: Snapshot capture
The worker SHALL process `snapshot:capture` jobs in parallel. Each job SHALL launch Playwright, navigate to the story URL, take a screenshot at the configured viewport, capture all console output and errors, and store results in object storage.

#### Scenario: Successful capture
- **WHEN** Playwright successfully renders and screenshots a story
- **THEN** the screenshot is uploaded to RustFS, a SnapshotLog is created with captured console output, and the Snapshot status is set to `captured`

#### Scenario: Story render error
- **WHEN** a story throws a JavaScript error during render
- **THEN** the screenshot is still captured, the error is recorded in SnapshotLog, and the Snapshot is flagged with a render error indicator

#### Scenario: Capture timeout
- **WHEN** Playwright cannot load the story within the configured timeout
- **THEN** the Snapshot status is set to `error` and the error is recorded

### Requirement: Snapshot diffing
The worker SHALL process `snapshot:diff` jobs after all captures for a build complete. Each job SHALL compare the captured screenshot against the approved baseline for that story × variant on the default branch using Pixelmatch.

#### Scenario: Diff within threshold
- **WHEN** the pixel difference between capture and baseline is within the configured threshold
- **THEN** the Diff status is set to `auto_approved` and no reviewer action is required

#### Scenario: Diff exceeds threshold
- **WHEN** the pixel difference exceeds the configured threshold
- **THEN** a diff image is generated and uploaded to RustFS, and the Diff status is set to `needs_review`

#### Scenario: No baseline exists (first default branch build)
- **WHEN** no approved baseline exists for a story × variant
- **THEN** the Diff status is set to `needs_review` — there is no automatic first-run approval

#### Scenario: Feature branch build
- **WHEN** a build is triggered on a non-default branch
- **THEN** captures are compared against the most recently approved baseline from the default branch, never against previous builds on the same branch

### Requirement: Build finalization
After all diffs for a build are resolved, the worker SHALL update the Build status. A build SHALL pass only if all diffs are `auto_approved`. If any diff is `needs_review`, the build status SHALL be `needs_review`.

#### Scenario: All diffs auto-approved
- **WHEN** all diffs for a build are within threshold
- **THEN** the Build status is set to `passed`

#### Scenario: Any diff needs review
- **WHEN** at least one diff has status `needs_review`
- **THEN** the Build status is set to `needs_review`

### Requirement: Baseline management
When a reviewer approves a diff on the default branch, the corresponding snapshot SHALL become the new baseline for that story × variant. Feature branch approvals SHALL NOT update baselines.

#### Scenario: Default branch approval updates baseline
- **WHEN** a reviewer approves a diff on a default branch build
- **THEN** the snapshot image becomes the new baseline for that story × variant

#### Scenario: Feature branch approval does not update baseline
- **WHEN** a reviewer approves a diff on a feature branch build
- **THEN** no baseline is updated

### Requirement: Secure image access via presigned URLs
All snapshot, diff, and baseline images stored in object storage SHALL be inaccessible without authentication. The system SHALL serve images via a Next.js route that validates session and project membership, then returns a short-lived presigned URL. The browser fetches the image directly from RustFS using that URL — no image bytes pass through the Next.js process.

#### Scenario: Authenticated image access
- **WHEN** an authenticated user with project access requests an image via the storage route
- **THEN** the system validates the request, generates a presigned URL with a short TTL (≤60 seconds), and redirects the browser to it

#### Scenario: Unauthenticated image request
- **WHEN** an unauthenticated request is made to the storage route
- **THEN** a 401 response is returned and no presigned URL is generated

#### Scenario: Presigned URL not reusable after TTL
- **WHEN** a presigned URL has expired
- **THEN** RustFS rejects the request with a 403; the client must request a new URL

### Requirement: Job retry and error handling
The build pipeline SHALL retry transient job failures using BullMQ's retry mechanism. Each job type SHALL have a defined retry policy. When all retries are exhausted, the affected record SHALL be marked with status `error` and the build SHALL be finalized with status `error`.

#### Scenario: Capture job retried on transient failure
- **WHEN** a `snapshot:capture` job fails due to a transient error (Playwright crash, timeout)
- **THEN** the job is retried up to 5 times with exponential backoff before the snapshot is marked `error`

#### Scenario: Diff job retried on transient failure
- **WHEN** a `snapshot:diff` job fails due to a transient error (storage read error)
- **THEN** the job is retried up to 3 times with exponential backoff before the diff is marked `error`

#### Scenario: Build with errored snapshots
- **WHEN** one or more snapshots reach terminal state `error`
- **THEN** the build finalizes with status `error`, distinct from `needs_review` and `passed`
