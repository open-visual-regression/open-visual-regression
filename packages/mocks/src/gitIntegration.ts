import type { GitIntegrationSchema } from "@ovr/api/contracts/gitIntegrations";

export const generateGitIntegration = (
  overrides?: Partial<GitIntegrationSchema>,
): GitIntegrationSchema => ({
  provider: "github",
  repoIdentifier: "acme/web",
  checkContext: "Open Visual Regression / Web",
  hasToken: true,
  ...overrides,
});
