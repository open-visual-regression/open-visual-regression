import type {
  GitConnectionSchema,
  GitProviderConnectionsSchema,
  GitProviderSummarySchema,
  GitRepositorySchema,
} from "@ovr/api/contracts/gitProviders";

export const generateProviderSummary = (
  overrides?: Partial<GitProviderSummarySchema>,
): GitProviderSummarySchema => ({
  id: "github",
  name: "github",
  repository: { placeholder: "owner/repo" },
  credentialTypes: ["connection", "access_token"],
  connections: {
    label: "github app",
    setupGuideUrl: "https://docs.openvisualregression.com/self-hosting/github-app",
    configured: true,
  },
  ...overrides,
});

export const generateConnection = (
  overrides?: Partial<GitConnectionSchema>,
): GitConnectionSchema => ({
  id: "42",
  name: "acme",
  description: "organization",
  manageUrl: "https://github.com/organizations/acme/settings/installations/42",
  repositoryCount: 12,
  warnings: [],
  ...overrides,
});

export const generateProviderConnections = (
  overrides?: Partial<GitProviderConnectionsSchema>,
): GitProviderConnectionsSchema => ({
  provider: "github",
  providerName: "github",
  label: "github app",
  setupGuideUrl: "https://docs.openvisualregression.com/self-hosting/github-app",
  status: {
    status: "ok",
    name: "acme-ovr",
    description: "owned by acme · commit statuses: write",
    manageUrl: "https://github.com/apps/acme-ovr",
    addUrl: "https://github.com/apps/acme-ovr/installations/new",
    warnings: [],
    connections: [generateConnection()],
  },
  ...overrides,
});

export const generateRepository = (
  overrides?: Partial<GitRepositorySchema>,
): GitRepositorySchema => ({
  connectionId: "42",
  id: "7",
  fullName: "acme/web",
  private: true,
  ...overrides,
});
