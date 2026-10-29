import type { GitProvider } from "@ovr/db/schema";

import type { Credential } from "../credentials";
import type { HttpRequest, PublishRequest, VerifyOutcome, VerifyRequest } from "../publisher";

/** One instance-level access source, e.g. a GitHub App installation. Ids are opaque. */
export type GitConnection = {
  id: string;
  name: string;
  description: string | null;
  manageUrl: string | null;
  repositoryCount: number | null;
  warnings: string[];
};

export type GitConnectionsStatus =
  | { status: "not_configured" }
  | { status: "error"; error: string }
  | {
      status: "ok";
      name: string;
      description: string | null;
      manageUrl: string | null;
      /** Where an admin goes to add another connection, e.g. install the app on another account. */
      addUrl: string | null;
      warnings: string[];
      connections: GitConnection[];
    };

/** A repository reachable through a connection. Ids are opaque to everything but the provider. */
export type GitRepository = {
  connectionId: string;
  id: string;
  fullName: string;
  private: boolean;
};

export type GitRepositoryPage = { repositories: GitRepository[]; nextCursor: string | null };

export type GitRepositorySearch = {
  connectionId?: string;
  query?: string;
  cursor?: string | null;
};

/**
 * Optional capability: access the instance's admin sets up once, which projects then pick
 * repositories from instead of storing their own token.
 */
export type GitConnections = {
  /** What the provider calls a connection, e.g. "github app". */
  label: string;
  setupGuideUrl: string;
  /** Cheap and offline: whether the instance has the settings connections need. */
  isConfigured: () => boolean;
  status: () => Promise<GitConnectionsStatus>;
  searchRepositories: (
    search: GitRepositorySearch,
  ) => Promise<GitRepositoryPage | { error: string }>;
  getRepository: (
    connectionId: string,
    repositoryId: string,
  ) => Promise<GitRepository | { error: string }>;
  credential: (
    connectionId: string,
    repositoryId: string,
    repoIdentifier: string,
  ) => Promise<Credential>;
  /** Confirms the token reaches the repository the project was linked to. */
  verify: (repoIdentifier: string, repositoryId: string, token: string) => Promise<VerifyOutcome>;
};

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
  connections?: GitConnections;
};
