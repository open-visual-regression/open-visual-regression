import { createPrivateKey, type KeyObject } from "node:crypto";
import { readFileSync } from "node:fs";

const APP_ID_VAR = "OVR_GITHUB_APP_ID";
const PRIVATE_KEY_FILE_VAR = "OVR_GITHUB_APP_PRIVATE_KEY_FILE";

export type GitHubAppConfig = {
  appId: string;
  privateKey: KeyObject;
};

export const GITHUB_APP_NOT_CONFIGURED = `GitHub App authentication is not configured on this deployment; set ${APP_ID_VAR} and ${PRIVATE_KEY_FILE_VAR}`;

export class GitHubAppConfigError extends Error {
  constructor(detail: string) {
    super(`GitHub App is misconfigured: ${detail}`);
    this.name = "GitHubAppConfigError";
  }
}

const readPrivateKeyFile = (path: string): string => {
  try {
    return readFileSync(path, "utf8");
  } catch (error) {
    const reason = error instanceof Error && "code" in error ? ` (${error.code})` : "";
    throw new GitHubAppConfigError(
      `${PRIVATE_KEY_FILE_VAR} points to ${path}, which could not be read${reason}`,
    );
  }
};

const parsePrivateKey = (path: string): KeyObject => {
  const pem = readPrivateKeyFile(path).trim();

  let key: KeyObject;
  try {
    key = createPrivateKey(pem);
  } catch {
    throw new GitHubAppConfigError(`${path} is not a valid PEM private key`);
  }

  if (key.asymmetricKeyType !== "rsa") {
    throw new GitHubAppConfigError(
      `${path} must hold the RSA private key GitHub generated for the App`,
    );
  }

  return key;
};

export const readGitHubAppConfig = (
  env: Record<string, string | undefined> = process.env,
): GitHubAppConfig | null => {
  const appId = env[APP_ID_VAR]?.trim();
  const keyPath = env[PRIVATE_KEY_FILE_VAR]?.trim();

  if (!appId && !keyPath) {
    return null;
  }

  if (!appId) {
    throw new GitHubAppConfigError(`${PRIVATE_KEY_FILE_VAR} is set but ${APP_ID_VAR} is not`);
  }

  if (!keyPath) {
    throw new GitHubAppConfigError(`${APP_ID_VAR} is set but ${PRIVATE_KEY_FILE_VAR} is not`);
  }

  return { appId, privateKey: parsePrivateKey(keyPath) };
};

export const assertGitHubAppConfig = (): void => {
  readGitHubAppConfig();
};
