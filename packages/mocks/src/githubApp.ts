import type { GithubAppInstallationSchema, GithubAppSchema } from "@ovr/api/contracts/githubApp";

export const generateGithubApp = (overrides?: Partial<GithubAppSchema>): GithubAppSchema => ({
  name: "acme-ovr",
  htmlUrl: "https://github.com/apps/acme-ovr",
  installUrl: "https://github.com/apps/acme-ovr/installations/new",
  ownerLogin: "acme",
  permissions: { statuses: "write", metadata: "read" },
  ...overrides,
});

export const generateGithubAppInstallation = (
  overrides?: Partial<GithubAppInstallationSchema>,
): GithubAppInstallationSchema => ({
  id: 42,
  accountLogin: "acme",
  accountType: "Organization",
  htmlUrl: "https://github.com/organizations/acme/settings/installations/42",
  repositorySelection: "selected",
  repositoryCount: 12,
  suspended: false,
  ...overrides,
});
