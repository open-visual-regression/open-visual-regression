## ADDED Requirements

### Requirement: Monorepo structure
The repository SHALL be organized as a Turborepo monorepo with pnpm workspaces containing `apps/web`, `apps/worker`, `apps/cli`, and shared packages under `packages/`.

#### Scenario: Workspace resolution
- **WHEN** a package in `apps/` imports from `@ovr/*` or `@repo/*`
- **THEN** pnpm resolves it to the correct local package without publishing

#### Scenario: Build pipeline
- **WHEN** `turbo build` is run from the root
- **THEN** all apps and packages build in correct dependency order with output caching

### Requirement: Shared packages
The monorepo SHALL provide the following internal packages: `@ovr/db` (schema + repositories + migrations), `@ovr/services` (business logic), `@ovr/api` (oRPC routers + middleware), `@ovr/queue` (BullMQ job types + producers), `@ovr/storage` (RustFS/S3 client), `@ovr/ui` (shadcn/ui + Base UI components), `@repo/typescript-config` (shared tsconfigs).

#### Scenario: Type sharing between apps
- **WHEN** `apps/worker` imports a job payload type from `@ovr/queue`
- **THEN** TypeScript resolves the type without any build step required

### Requirement: Oxlint + Oxfmt toolchain
The repository SHALL use Oxlint for linting and Oxfmt for formatting, replacing ESLint and Prettier. Oxlint SHALL have the `react`, `typescript`, `import`, and `unicorn` plugin rule sets enabled. Oxfmt SHALL have Tailwind CSS class sorting enabled.

#### Scenario: Lint runs on all packages
- **WHEN** `turbo lint` is run from the root
- **THEN** Oxlint checks all TypeScript and TSX files across all apps and packages

#### Scenario: Format runs on all packages
- **WHEN** `turbo format` is run from the root
- **THEN** Oxfmt formats all files and sorts Tailwind classes

#### Scenario: Tailwind class order enforced
- **WHEN** Oxfmt formats a file containing unsorted Tailwind classes
- **THEN** classes are reordered to match Tailwind's canonical order

### Requirement: Single Docker image
The repository SHALL produce a single Docker image that supports multiple runtime roles via the `OVR_ROLE` environment variable. Supported roles: `app` (default), `worker`, `migrate`, `rustfs-init`.

#### Scenario: Role switching
- **WHEN** a container starts with `OVR_ROLE=worker`
- **THEN** the BullMQ worker process starts, not the Next.js server

#### Scenario: Default role
- **WHEN** a container starts without `OVR_ROLE` set
- **THEN** the Next.js app server starts

### Requirement: Docker Compose deployment
The repository SHALL include a `docker-compose.yml` that starts a fully functional OVR instance with seven services: `app`, `worker`, `postgres`, `valkey`, `rustfs`, `rustfs-init`, `migrate`. The only required user-provided values SHALL be `POSTGRES_PASSWORD` and `BETTER_AUTH_SECRET`.

#### Scenario: Cold start
- **WHEN** a user runs `docker compose up` with only `POSTGRES_PASSWORD` and `BETTER_AUTH_SECRET` set
- **THEN** all services start, migrations run, and OVR is accessible at `http://localhost:3000`

#### Scenario: Missing required secret
- **WHEN** `POSTGRES_PASSWORD` or `BETTER_AUTH_SECRET` is not set
- **THEN** Docker Compose fails with a clear error message before any container starts

#### Scenario: DATABASE_URL construction
- **WHEN** `POSTGRES_USER`, `POSTGRES_PASSWORD`, and `POSTGRES_DB` are set
- **THEN** `DATABASE_URL` is constructed from those values internally — users do not write a connection string

### Requirement: Environment configuration
All configuration SHALL be provided via environment variables. An `.env.example` file SHALL document all variables with defaults. `POSTGRES_USER` (default: `ovr`), `POSTGRES_DB` (default: `ovr`), and `BASE_URL` (default: `http://localhost:3000`) SHALL be optional. Only `POSTGRES_PASSWORD` and `BETTER_AUTH_SECRET` are required.

#### Scenario: Custom postgres credentials
- **WHEN** `POSTGRES_USER` and `POSTGRES_DB` are set to non-default values
- **THEN** both the postgres container and app container use those values consistently

### Requirement: Testing infrastructure
The repository SHALL use Vitest as the test runner across all packages. React component tests SHALL use Testing Library. Integration tests that require real infrastructure SHALL use Testcontainers. Each package SHALL have a `test` script wired into the Turbo pipeline.

#### Scenario: Unit tests run without infrastructure
- **WHEN** `turbo test` is run and a package has only unit tests
- **THEN** tests complete without starting any containers

#### Scenario: Integration tests use real containers
- **WHEN** a package with Testcontainers-based tests runs
- **THEN** the required containers (Postgres, Valkey, or MinIO-compatible) are started before the test suite and stopped after

#### Scenario: Component tests render without a browser
- **WHEN** Testing Library renders a React component in a test
- **THEN** the component renders in a jsdom environment without requiring a real browser

### Requirement: GitHub Actions CI
The repository SHALL have a GitHub Actions workflow that runs on every push to `main` and every pull request targeting `main`. The workflow SHALL run five jobs: `lint`, `format-check`, `type-check`, `build`, and `test`. All jobs SHALL pass before a pull request can merge.

#### Scenario: PR with lint failure blocked
- **WHEN** a pull request introduces an Oxlint violation
- **THEN** the `lint` job fails and the PR cannot merge

#### Scenario: PR with type error blocked
- **WHEN** a pull request introduces a TypeScript type error
- **THEN** the `type-check` job fails and the PR cannot merge

#### Scenario: PR with failing tests blocked
- **WHEN** a pull request introduces a failing test
- **THEN** the `test` job fails and the PR cannot merge

#### Scenario: All jobs pass
- **WHEN** all five CI jobs pass on a pull request
- **THEN** the branch protection requirement is satisfied
