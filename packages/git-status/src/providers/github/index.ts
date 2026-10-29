import type { GitProviderModule } from "../types";
import { assertGithubAppConfig } from "./app/config";
import { githubStatuses } from "./statuses";

export const githubProvider: GitProviderModule = {
  id: "github",
  name: "github",
  assertConfig: assertGithubAppConfig,
  repository: {
    placeholder: "owner/repo",
    commitUrl: (repoIdentifier, sha) => `https://github.com/${repoIdentifier}/commit/${sha}`,
    branchUrl: (repoIdentifier, branch) => `https://github.com/${repoIdentifier}/tree/${branch}`,
  },
  statuses: githubStatuses,
};
