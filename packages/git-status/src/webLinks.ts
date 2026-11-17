import type { GitProvider } from "@ovr/db/schema";

type WebLinks = {
  commitUrl: (sha: string) => string;
  branchUrl: (branch: string) => string;
  pullRequestUrl: (pullRequestNumber: number) => string;
};

export const buildWebLinks = (provider: GitProvider, repoIdentifier: string): WebLinks => {
  switch (provider) {
    case "github": {
      const base = `https://github.com/${repoIdentifier}`;
      return {
        commitUrl: (sha) => `${base}/commit/${sha}`,
        branchUrl: (branch) => `${base}/tree/${branch}`,
        pullRequestUrl: (pullRequestNumber) => `${base}/pull/${pullRequestNumber}`,
      };
    }
  }
};
