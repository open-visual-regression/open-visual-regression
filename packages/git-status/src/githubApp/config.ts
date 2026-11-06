import { createPrivateKey, type KeyObject } from "node:crypto";

const APP_ID_VAR = "OVR_GITHUB_APP_ID";
const PRIVATE_KEY_VAR = "OVR_GITHUB_APP_PRIVATE_KEY";

export type GitHubAppConfig = {
  appId: string;
  privateKey: KeyObject;
};

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

/**
 * Reads the deployment's GitHub App from the environment. Returns null when neither variable is
 * set, and throws when only one is set or the key can't be parsed.
 */
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

/** Fails startup on a half-configured App instead of failing every publish later. */
export const assertGitHubAppConfig = (): void => {
  readGitHubAppConfig();
};
