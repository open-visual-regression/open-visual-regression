import type { GitProviderModule } from "../types";
import { githubStatuses } from "./statuses";

export const githubProvider: GitProviderModule = {
  id: "github",
  name: "github",
  repository: {
    placeholder: "owner/repo",
    commitUrl: (repoIdentifier, sha) => `https://github.com/${repoIdentifier}/commit/${sha}`,
    branchUrl: (repoIdentifier, branch) => `https://github.com/${repoIdentifier}/tree/${branch}`,
  },
  statuses: githubStatuses,
};
