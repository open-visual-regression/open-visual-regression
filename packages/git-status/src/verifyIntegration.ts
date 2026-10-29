import { resolveCredential, type Credential, type IntegrationCredentials } from "./credentials";
import { verify, type VerifyOutcome } from "./publisher";
import { getProvider } from "./registry";

const verifyWith = (integration: IntegrationCredentials, token: string): Promise<VerifyOutcome> => {
  const provider = getProvider(integration.provider);

  if (integration.credentialType === "connection" && provider.connections) {
    return provider.connections.verify(
      integration.repoIdentifier,
      integration.externalRepoId ?? "",
      token,
    );
  }

  return verify(provider.statuses.buildVerifyRequest(integration.repoIdentifier, token));
};

const failed = (credential: Extract<Credential, { ok: false }>): VerifyOutcome => ({
  ok: false,
  httpStatus: null,
  error: credential.error,
});

export const verifyIntegration = async (
  integration: IntegrationCredentials,
): Promise<VerifyOutcome> => {
  const credential = await resolveCredential(integration);
  if (!credential.ok) {
    return failed(credential);
  }

  const outcome = await verifyWith(integration, credential.token);
  if (outcome.httpStatus !== 401 || !credential.renew) {
    return outcome;
  }

  // A cached connection token can be revoked before it expires. Retry once with a fresh one.
  const renewed = await credential.renew();
  return renewed.ok ? verifyWith(integration, renewed.token) : failed(renewed);
};
