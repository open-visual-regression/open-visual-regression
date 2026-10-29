import type { FakeGithubInstallation, FakeGithubRepository } from "@ovr/mocks/handlers/github";

/** The repository the specs link projects to. */
const LINKED_REPOSITORY: FakeGithubRepository = {
  id: 101,
  fullName: "ovr-e2e-org/web",
  private: true,
};

/** What the E2E suite's fake GitHub knows about. Specs assert against the same data. */
export const E2E_GITHUB = {
  clientId: "Iv23liE2E",
  app: { slug: "ovr-e2e", ownerLogin: "ovr-e2e-org" },
  installation: {
    id: 4242,
    account: { login: "ovr-e2e-org", type: "Organization" },
    repositories: [LINKED_REPOSITORY, { id: 102, fullName: "ovr-e2e-org/api", private: false }],
  } satisfies FakeGithubInstallation,
  linkedRepository: LINKED_REPOSITORY,
} as const;
