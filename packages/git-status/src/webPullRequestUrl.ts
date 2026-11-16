import type { GitProvider } from "@ovr/db/schema";

export const buildPullRequestUrl = (
  provider: GitProvider,
  repoIdentifier: string,
  pullRequestNumber: number,
): string => {
  switch (provider) {
    case "github":
      return `https://github.com/${repoIdentifier}/pull/${pullRequestNumber}`;
  }
};
