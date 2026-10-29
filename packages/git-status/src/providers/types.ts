import type { GitProvider } from "@ovr/db/schema";

import type { HttpRequest, PublishRequest, VerifyRequest } from "../publisher";

/**
 * Everything OVR needs to know about one git provider. The rest of the app only talks to
 * providers through this shape, so adding a provider means adding a module, not touching
 * every layer.
 */
export type GitProviderModule = {
  id: GitProvider;
  name: string;
  /** Throws when the provider's instance settings are invalid, so OVR fails at startup. */
  assertConfig?: () => void;
  repository: {
    /** How the provider names a repository, shown as a hint where one is typed in. */
    placeholder: string;
    commitUrl: (repoIdentifier: string, sha: string) => string;
    branchUrl: (repoIdentifier: string, branch: string) => string;
  };
  statuses: {
    buildRequest: (repoIdentifier: string, token: string, request: PublishRequest) => HttpRequest;
    buildVerifyRequest: (repoIdentifier: string, token: string) => VerifyRequest;
  };
};
