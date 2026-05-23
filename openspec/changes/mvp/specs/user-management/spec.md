## ADDED Requirements

### Requirement: User list
Admins SHALL be able to view a list of all users on the instance, including their name, email, role, and account creation date.

#### Scenario: Admin views user list
- **WHEN** an admin navigates to the user management page
- **THEN** all users are shown with name, email, role, and joined date

#### Scenario: Non-admin access
- **WHEN** a `user`-role user attempts to access the user management page
- **THEN** they receive a 403 or are redirected

### Requirement: Settings layout
The settings area SHALL use a two-column layout: a 200px sub-nav rail on the left and a scrollable content area on the right. The sub-nav has two sections — personal (profile, api keys, sessions) and admin (users, invitations, instance). Non-admin users see only the personal section.

### Requirement: Invite user
Admins SHALL be able to create invitations via the admin UI using an "invite user" modal. The modal collects an email address and a role (user or admin, defaulting to user). The invite SHALL be issued via Better Auth's Organization invitation system. The resulting invite URL SHALL be displayed in a one-time banner for copying.

#### Scenario: Invite modal
- **WHEN** an admin clicks "invite user"
- **THEN** a modal appears with an email field and a role toggle (user / admin). The description explains that no email is sent and the resulting URL must be shared manually.

#### Scenario: Successful invite — URL banner
- **WHEN** an admin submits the invite modal
- **THEN** the modal closes, and an inline alert banner (success tone) appears above the user list showing the full invite URL with a copy button. The banner states it will not appear again once dismissed.

#### Scenario: Duplicate invite
- **WHEN** an admin creates an invitation for an email that already has a pending invite
- **THEN** the system shows an error or offers to replace it.

### Requirement: Pending invitations list
Admins SHALL be able to view all pending (unused, unexpired) invitations in a table above the members list. Each row shows: email, invited-by, issued time, expiry countdown (with stale glyph when close to expiry), copy-URL action, and cancel action.

#### Scenario: View pending invitations
- **WHEN** an admin views the users page
- **THEN** pending invitations are shown in a table with email, invited-by, issued time, and expiry. Invitations close to expiry show the `△` glyph and a highlighted expiry label.

#### Scenario: Copy invite link
- **WHEN** an admin clicks "copy" on a pending invitation row
- **THEN** the invite URL is copied to the clipboard.

#### Scenario: Cancel invitation
- **WHEN** an admin clicks the X button on a pending invitation
- **THEN** the invitation token is invalidated and the row is removed from the list.

### Requirement: User list details
The members table SHALL show: avatar monogram (2-letter initials, square 2px radius), name, "(you)" label for the current user, deactivated badge if applicable, email, role badge, joined date, last-seen timestamp, and an actions menu (chevronDown icon).

#### Scenario: Deactivated user display
- **WHEN** a user has been deactivated
- **THEN** their row is shown at 50% opacity with a `DEACTIVATED` fail-tone badge.

### Requirement: Change user role
Admins SHALL be able to change a user's role between `admin` and `user`.

#### Scenario: Promote to admin
- **WHEN** an admin changes a user's role to `admin`
- **THEN** the user immediately gains admin permissions on their next request

#### Scenario: Cannot demote self
- **WHEN** an admin attempts to change their own role
- **THEN** the action is rejected with an error message

### Requirement: Deactivate user
Admins SHALL be able to deactivate (ban) a user, preventing them from signing in. Existing sessions SHALL be invalidated.

#### Scenario: Deactivate user
- **WHEN** an admin deactivates a user
- **THEN** the user's active sessions are revoked and they cannot log in

#### Scenario: Deactivated user attempts login
- **WHEN** a deactivated user attempts to log in
- **THEN** they receive an error stating their account is disabled

#### Scenario: Cannot deactivate self
- **WHEN** an admin attempts to deactivate their own account
- **THEN** the action is rejected
