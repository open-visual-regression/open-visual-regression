import { createPrivateKey, type KeyObject } from "node:crypto";

const ENV_VARS = {
  clientId: "OVR_GITHUB_APP_CLIENT_ID",
  privateKey: "OVR_GITHUB_APP_PRIVATE_KEY",
} as const;

const PEM_HEADER = "-----BEGIN";

export type GithubAppConfig = {
  clientId: string;
  privateKey: KeyObject;
};

export class GithubAppConfigError extends Error {
  constructor(detail: string) {
    super(`GitHub App config is invalid: ${detail}`);
    this.name = "GithubAppConfigError";
  }
}

// Env files and secret stores often can't hold a multi-line PEM, so accept it with escaped
// newlines or base64 encoded as well as verbatim.
const decodePem = (raw: string): string => {
  if (raw.includes(PEM_HEADER)) {
    return raw.replaceAll("\\n", "\n");
  }

  return Buffer.from(raw, "base64").toString("utf8");
};

const parsePrivateKey = (raw: string): KeyObject => {
  const pem = decodePem(raw.trim());

  if (!pem.includes(PEM_HEADER)) {
    throw new GithubAppConfigError(`${ENV_VARS.privateKey} must be a PEM private key`);
  }

  try {
    const key = createPrivateKey(pem);
    if (key.asymmetricKeyType !== "rsa") {
      throw new GithubAppConfigError(`${ENV_VARS.privateKey} must be an RSA private key`);
    }
    return key;
  } catch (error) {
    if (error instanceof GithubAppConfigError) {
      throw error;
    }
    throw new GithubAppConfigError(`${ENV_VARS.privateKey} could not be read as a private key`);
  }
};

let cached: { clientId: string; privateKey: string; config: GithubAppConfig | null } | undefined;

/**
 * The instance's GitHub App, or null when none is configured. Throws when the app is only
 * partly configured, so a typo surfaces at startup instead of on the first status.
 */
export const getGithubAppConfig = (): GithubAppConfig | null => {
  const clientId = process.env[ENV_VARS.clientId]?.trim() ?? "";
  const privateKey = process.env[ENV_VARS.privateKey]?.trim() ?? "";

  if (cached?.clientId === clientId && cached.privateKey === privateKey) {
    return cached.config;
  }

  let config: GithubAppConfig | null = null;

  if (clientId || privateKey) {
    if (!clientId) {
      throw new GithubAppConfigError(
        `${ENV_VARS.clientId} is required when ${ENV_VARS.privateKey} is set`,
      );
    }
    if (!privateKey) {
      throw new GithubAppConfigError(
        `${ENV_VARS.privateKey} is required when ${ENV_VARS.clientId} is set`,
      );
    }
    config = { clientId, privateKey: parsePrivateKey(privateKey) };
  }

  cached = { clientId, privateKey, config };
  return config;
};

export const assertGithubAppConfig = (): void => {
  getGithubAppConfig();
};
