import type { GitProvider } from "@ovr/db/schema";

export const buildBranchUrl = (
  provider: GitProvider,
  repoIdentifier: string,
  branch: string,
): string => {
  switch (provider) {
    case "github":
      return `https://github.com/${repoIdentifier}/tree/${branch}`;
  }
};
