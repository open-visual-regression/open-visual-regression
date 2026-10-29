import { GithubAppRequestError, listInstallations } from "./client";
import {
  getGithubAppConfig,
  GithubAppConfigError,
  REJECTED_CREDENTIALS_MESSAGE,
  type GithubAppConfig,
} from "./config";
import { listRepositoriesForInstallation } from "./tokens";

export type GithubAppRepositories =
  | { status: "not_configured" }
  | { status: "error"; error: string }
  | {
      status: "ok";
      repositories: {
        installationId: number;
        accountLogin: string | null;
        id: number;
        fullName: string;
        private: boolean;
      }[];
    };

export const describeGithubAppError = (error: GithubAppRequestError): string =>
  error.status === 401 ? REJECTED_CREDENTIALS_MESSAGE : error.message;

const loadConfig = ():
  | { config: GithubAppConfig }
  | Exclude<GithubAppRepositories, { status: "ok" }> => {
  try {
    const config = getGithubAppConfig();
    return config ? { config } : { status: "not_configured" };
  } catch (error) {
    if (error instanceof GithubAppConfigError) {
      return { status: "error", error: error.message };
    }
    throw error;
  }
};

/** Every repository the app can post statuses to, across its active installations. */
export const listAppRepositories = async (): Promise<GithubAppRepositories> => {
  const loaded = loadConfig();
  if (!("config" in loaded)) {
    return loaded;
  }
  const { config } = loaded;

  try {
    const installations = (await listInstallations(config)).filter(
      (installation) => !installation.suspended,
    );
    const perInstallation = await Promise.all(
      installations.map(async (installation) =>
        (await listRepositoriesForInstallation(config, installation.id)).map((repository) => ({
          installationId: installation.id,
          accountLogin: installation.accountLogin,
          id: repository.id,
          fullName: repository.fullName,
          private: repository.private,
        })),
      ),
    );

    return {
      status: "ok",
      repositories: perInstallation.flat().sort((a, b) => a.fullName.localeCompare(b.fullName)),
    };
  } catch (error) {
    if (error instanceof GithubAppRequestError) {
      return { status: "error", error: describeGithubAppError(error) };
    }
    throw error;
  }
};

/**
 * The repository with this id, if the installation has been granted it. Returns an error
 * message instead when the app can't be used or the repository isn't in the installation.
 */
export const findInstallationRepository = async (
  installationId: number,
  repositoryId: number,
): Promise<{ fullName: string } | { error: string }> => {
  const loaded = loadConfig();
  if (!("config" in loaded)) {
    return {
      error:
        loaded.status === "error" ? loaded.error : "github app is not configured on this instance",
    };
  }

  try {
    const repositories = await listRepositoriesForInstallation(loaded.config, installationId);
    const repository = repositories.find(({ id }) => id === repositoryId);
    return repository
      ? { fullName: repository.fullName }
      : { error: "the github app installation can't access that repository" };
  } catch (error) {
    if (error instanceof GithubAppRequestError) {
      return { error: describeGithubAppError(error) };
    }
    throw error;
  }
};
