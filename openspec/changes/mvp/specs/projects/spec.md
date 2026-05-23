## ADDED Requirements

### Requirement: Create project
Admins SHALL be able to create a project by providing a name, a URL-safe slug, and a default branch name.

#### Scenario: Successful project creation
- **WHEN** an admin submits the create project form with a valid name, slug, and default branch
- **THEN** the project is created and the admin is redirected to the project settings page

#### Scenario: Duplicate slug
- **WHEN** an admin attempts to create a project with a slug that already exists
- **THEN** the slug field border turns red and an inline error message appears below the field (e.g. `slug "checkout-flow" is already taken on this instance.`). The submit button is disabled.

#### Scenario: Post-creation redirect
- **WHEN** a project is created
- **THEN** the admin is redirected to the project settings page. An inline "next step" hint explains that at least one variant must be added before the project accepts builds.

#### Scenario: Non-admin cannot create project
- **WHEN** a `user`-role user attempts to create a project
- **THEN** the action is rejected

### Requirement: Project list
All authenticated users SHALL be able to view a list of all projects on the instance as a card grid.

#### Scenario: View projects
- **WHEN** an authenticated user navigates to the projects page
- **THEN** all projects are shown as cards in a responsive grid. Each card shows: name, description, changed-count badge (amber, filled) if any diffs need review, total run count, and baseline branch. Cards with no changed diffs show a green `○` glyph.

#### Scenario: Empty project list
- **WHEN** no projects exist
- **THEN** an empty state is shown with a dashed border, pixel-grid texture, `∅` glyph, explanatory text, and a "create first project" primary CTA.

### Requirement: Configure variants
Admins SHALL be able to define variants for a project from the project settings page. A variant is a named browser + viewport combination (width × height). At least one variant SHALL be required for a project to accept builds.

#### Scenario: Add variant
- **WHEN** an admin clicks "add variant" and submits a name, browser (chromium/firefox/webkit), width, and height
- **THEN** the variant row is added inline (not via modal) and saved. The table immediately shows the new variant.

#### Scenario: Multiple variants
- **WHEN** a project has multiple variants defined
- **THEN** each story in a build produces one snapshot per variant

#### Scenario: Delete variant
- **WHEN** an admin removes a variant via the X button on its row
- **THEN** the variant is removed; existing snapshots for that variant are unaffected

### Requirement: Project settings tabs
The project settings page SHALL have tab navigation: runs · settings · api · logs.

#### Scenario: Settings tab
- **WHEN** an admin navigates to the settings tab
- **THEN** they see general settings (name, slug, default branch, diff threshold) and the variants table.

#### Scenario: Diff threshold setting
- **WHEN** an admin sets the diff threshold (expressed as % of changed pixels)
- **THEN** future diffs below this threshold are auto-approved without requiring review.

#### Scenario: Runs tab
- **WHEN** a user navigates to the runs tab
- **THEN** they see the run list for this project (same as the main runs list view).

### Requirement: API key management
Authenticated users SHALL be able to create API keys scoped to their account for use with the CLI. API keys are personal — bound to the creating user's account. Users SHALL be able to list and revoke their own API keys. Admins SHALL be able to revoke any user's API keys. The API keys UI lives under `/settings/api-keys` using the settings sub-nav layout.

#### Scenario: Create API key
- **WHEN** an authenticated user creates an API key with a descriptive name
- **THEN** the full key value (format: `ovr_pk_live_<random>`) is shown once in an accent-tone alert banner above the key list. The banner instructs the user to copy now and set `OVR_API_KEY` in their CI environment or pass `--api-key` to `ovr snapshot`. The key is stored as a hash; the secret value cannot be retrieved again.

#### Scenario: Key value not retrievable
- **WHEN** a user views their existing API keys after the reveal banner is dismissed
- **THEN** only the key name, prefix (`ovr_pk_•••`), creation date, and last-used date are shown.

#### Scenario: Stale key indicator
- **WHEN** an API key has a last-used value of "never"
- **THEN** the key is flagged with the `△` stale glyph and a muted highlight.

#### Scenario: Revoke API key
- **WHEN** a user revokes an API key via the X button
- **THEN** any subsequent CLI requests using that key are rejected.

### Requirement: Delete project
Admins SHALL be able to delete a project from the project settings danger zone. All associated builds, snapshots, diffs, baselines, and stored files SHALL be deleted. The action SHALL require typing the project slug as confirmation.

#### Scenario: Delete confirmation
- **WHEN** an admin clicks "delete project…"
- **THEN** an alert dialog appears showing the count of builds, snapshots, baselines, and storage size that will be deleted. The admin must type the exact project slug into a text field to enable the "delete project" confirm button.

#### Scenario: Delete project
- **WHEN** the admin confirms with the correct slug
- **THEN** the project and all its data are permanently removed, including files in object storage, and the admin is redirected to the projects list.
