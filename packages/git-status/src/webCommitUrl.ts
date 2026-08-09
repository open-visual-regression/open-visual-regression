import type { GitProvider } from "@ovr/db/schema";

const resolveWebBase = (provider: GitProvider): string => {
  switch (provider) {
    case "github":
      return "https://github.com";
  }
};

export const buildCommitUrl = (
  provider: GitProvider,
  repoIdentifier: string,
  sha: string,
): string => `${resolveWebBase(provider)}/${repoIdentifier}/commit/${sha}`;
