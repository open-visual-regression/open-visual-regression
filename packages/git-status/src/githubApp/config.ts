import { createPrivateKey, type KeyObject } from "node:crypto";

const APP_ID_VAR = "OVR_GITHUB_APP_ID";
const PRIVATE_KEY_VAR = "OVR_GITHUB_APP_PRIVATE_KEY";

export type GitHubAppConfig = {
  appId: string;
  privateKey: KeyObject;
};

export const GITHUB_APP_NOT_CONFIGURED = `GitHub App authentication is not configured on this deployment; set ${APP_ID_VAR} and ${PRIVATE_KEY_VAR}`;

export class GitHubAppConfigError extends Error {
  constructor(detail: string) {
    super(`GitHub App is misconfigured: ${detail}`);
    this.name = "GitHubAppConfigError";
  }
}

// Secret stores often hold the PEM on one line with escaped newlines.
const normalizePrivateKey = (raw: string): string => raw.trim().replace(/\\n/g, "\n");

const parsePrivateKey = (raw: string): KeyObject => {
  let key: KeyObject;
  try {
    key = createPrivateKey(normalizePrivateKey(raw));
  } catch {
    throw new GitHubAppConfigError(`${PRIVATE_KEY_VAR} is not a valid PEM private key`);
  }

  if (key.asymmetricKeyType !== "rsa") {
    throw new GitHubAppConfigError(
      `${PRIVATE_KEY_VAR} must be the RSA private key GitHub generated for the App`,
    );
  }

  return key;
};

export const readGitHubAppConfig = (
  env: Record<string, string | undefined> = process.env,
): GitHubAppConfig | null => {
  const appId = env[APP_ID_VAR]?.trim();
  const rawKey = env[PRIVATE_KEY_VAR]?.trim();

  if (!appId && !rawKey) {
    return null;
  }

  if (!appId) {
    throw new GitHubAppConfigError(`${PRIVATE_KEY_VAR} is set but ${APP_ID_VAR} is not`);
  }

  if (!rawKey) {
    throw new GitHubAppConfigError(`${APP_ID_VAR} is set but ${PRIVATE_KEY_VAR} is not`);
  }

  return { appId, privateKey: parsePrivateKey(rawKey) };
};

export const assertGitHubAppConfig = (): void => {
  readGitHubAppConfig();
};
