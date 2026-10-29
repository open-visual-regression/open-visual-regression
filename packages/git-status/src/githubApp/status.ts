import { getApp, GithubAppRequestError, listInstallations } from "./client";
import {
  getGithubAppConfig,
  GithubAppConfigError,
  REJECTED_CREDENTIALS_MESSAGE,
  type GithubAppConfig,
} from "./config";
import { listRepositoriesForInstallation } from "./tokens";

export type GithubAppStatus =
  | { status: "not_configured" }
  | { status: "error"; error: string }
  | {
      status: "ok";
      app: {
        name: string;
        htmlUrl: string;
        installUrl: string;
        ownerLogin: string | null;
        permissions: Record<string, string>;
      };
      installations: {
        id: number;
        accountLogin: string | null;
        accountType: string | null;
        htmlUrl: string;
        repositorySelection: "all" | "selected";
        repositoryCount: number | null;
        suspended: boolean;
      }[];
    };

const countRepositories = (config: GithubAppConfig, installationId: number) =>
  listRepositoriesForInstallation(config, installationId).then(
    (repositories) => repositories.length,
    () => null,
  );

/** The instance's GitHub App as GitHub sees it: the registration and where it is installed. */
export const getGithubAppStatus = async (): Promise<GithubAppStatus> => {
  let config: GithubAppConfig | null;
  try {
    config = getGithubAppConfig();
  } catch (error) {
    if (error instanceof GithubAppConfigError) {
      return { status: "error", error: error.message };
    }
    throw error;
  }

  if (!config) {
    return { status: "not_configured" };
  }

  try {
    const [app, installations] = await Promise.all([getApp(config), listInstallations(config)]);

    return {
      status: "ok",
      app: {
        name: app.name,
        htmlUrl: app.htmlUrl,
        installUrl: `${app.htmlUrl}/installations/new`,
        ownerLogin: app.ownerLogin,
        permissions: app.permissions,
      },
      installations: await Promise.all(
        installations.map(async (installation) => ({
          id: installation.id,
          accountLogin: installation.accountLogin,
          accountType: installation.accountType,
          htmlUrl: installation.htmlUrl,
          repositorySelection: installation.repositorySelection,
          repositoryCount: installation.suspended
            ? null
            : await countRepositories(config, installation.id),
          suspended: installation.suspended,
        })),
      ),
    };
  } catch (error) {
    if (!(error instanceof GithubAppRequestError)) {
      throw error;
    }

    return {
      status: "error",
      error: error.status === 401 ? REJECTED_CREDENTIALS_MESSAGE : error.message,
    };
  }
};
