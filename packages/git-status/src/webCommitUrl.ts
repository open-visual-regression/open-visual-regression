import type { GitProvider } from "@ovr/db/schema";

export const buildCommitUrl = (
  provider: GitProvider,
  repoIdentifier: string,
  sha: string,
): string => {
  switch (provider) {
    case "github":
      return `https://github.com/${repoIdentifier}/commit/${sha}`;
  }
};
