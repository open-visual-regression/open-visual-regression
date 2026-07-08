import type { GitProvider } from "@ovr/db/schema";

import type { Adapter } from "../publisher";
import { githubFamilyAdapter } from "./githubFamily";
import { gitlabAdapter } from "./gitlab";

export const resolveAdapter = (provider: GitProvider): Adapter => {
  switch (provider) {
    case "github":
    case "github_enterprise":
    case "gitea":
    case "forgejo":
      return githubFamilyAdapter;
    case "gitlab":
      return gitlabAdapter;
  }
};
