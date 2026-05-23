## ADDED Requirements

### Requirement: First-run wizard
The system SHALL detect when no users exist and redirect all requests to `/setup`. The setup page SHALL collect an organization name and create the first admin account. After setup completes, the middleware SHALL no longer intercept requests.

#### Scenario: First visit on fresh instance
- **WHEN** a user visits any URL on a fresh instance with no users
- **THEN** they are redirected to `/setup` regardless of the requested path

#### Scenario: Setup completion
- **WHEN** the admin submits the setup form with a valid org name, email, and password
- **THEN** the organization is created, the admin account is created with `admin` role, the user is signed in, and they are redirected to the dashboard

#### Scenario: Setup already completed
- **WHEN** a user visits `/setup` after an admin account already exists
- **THEN** they are redirected to `/login`

### Requirement: Invite-only registration
The system SHALL NOT provide a public signup form. User accounts SHALL only be created via admin-issued invitations. No route SHALL allow unauthenticated users to create accounts except through a valid invite token.

#### Scenario: No signup route
- **WHEN** a user navigates to `/signup` or any equivalent path
- **THEN** they receive a 404 response

#### Scenario: Account creation without invite
- **WHEN** a POST request is made to create a user without a valid invite token
- **THEN** the request is rejected with an error

### Requirement: Invitation flow
Admins SHALL be able to create invitations via the admin UI. The system SHALL generate a single-use invitation token via Better Auth's Organization plugin and display the resulting invite URL for the admin to copy and share.

#### Scenario: Admin issues invite
- **WHEN** an admin creates an invitation
- **THEN** an invitation record is created and the invite URL is displayed in the admin UI for copying

#### Scenario: Valid invite accepted
- **WHEN** an invited user visits `/invite/[invitationId]` with a valid, unexpired token
- **THEN** they are shown a form to set their name and password

#### Scenario: Account created via invite
- **WHEN** the invited user submits the form with valid name and password
- **THEN** their account is created, they are signed in, the invitation token is marked as used, and they are redirected to the dashboard

#### Scenario: Expired invite
- **WHEN** a user visits an invite link that is older than 48 hours
- **THEN** they see an error message stating the invitation has expired

#### Scenario: Already-used invite
- **WHEN** a user visits an invite link that has already been accepted
- **THEN** they see an error message stating the invitation is no longer valid

### Requirement: Session-based authentication for web UI
The system SHALL use Better Auth session cookies for web UI authentication. Unauthenticated requests to protected routes SHALL be redirected to `/login`.

#### Scenario: Unauthenticated access
- **WHEN** an unauthenticated user requests a protected route
- **THEN** they are redirected to `/login` with the original path as a redirect parameter

#### Scenario: Successful login
- **WHEN** a user submits valid credentials on `/login`
- **THEN** a session cookie is set and they are redirected to the dashboard or the originally requested path

#### Scenario: Invalid credentials
- **WHEN** a user submits incorrect credentials
- **THEN** an error message is shown and no session is created

#### Scenario: Sign out
- **WHEN** a user clicks sign out
- **THEN** their session is invalidated and they are redirected to `/login`

### Requirement: API key authentication for CLI
The system SHALL allow authenticated users to create API keys. The CLI SHALL authenticate all oRPC requests using a Bearer API key in the `Authorization` header. The oRPC middleware SHALL reject requests with missing or invalid API keys.

#### Scenario: API key creation
- **WHEN** an authenticated user creates an API key in the UI
- **THEN** the full key is shown once and never displayed again

#### Scenario: Valid API key on oRPC request
- **WHEN** a CLI request includes a valid Bearer API key
- **THEN** the request is processed as the user who owns that key

#### Scenario: Invalid or missing API key
- **WHEN** a CLI request is missing the Authorization header or the key is invalid
- **THEN** the request is rejected with an UNAUTHORIZED error

### Requirement: Role-based access control
The system SHALL enforce two roles: `admin` and `user`. `admin` users have full access. `user` is the default role for all invited users. Role enforcement SHALL occur in the service layer, not only in UI.

#### Scenario: Admin-only action by non-admin
- **WHEN** a `user`-role user attempts an admin-only action (e.g., invite user, delete project)
- **THEN** the service returns a FORBIDDEN error regardless of how the request was made

#### Scenario: New user default role
- **WHEN** a user accepts an invitation without an explicit role override
- **THEN** their account is created with the `user` role

### Requirement: Auth rate limiting
Better Auth's built-in rate limiting SHALL be enabled on authentication endpoints to prevent brute-force attacks.

#### Scenario: Repeated failed login attempts
- **WHEN** the same IP address makes more than the configured number of failed login attempts in a time window
- **THEN** subsequent requests are rate-limited and return a 429 response
