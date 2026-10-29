import { resolveAdapter } from "./adapters";
import { resolveCredential, type Credential, type IntegrationCredentials } from "./credentials";
import { verify, verifyRepository, type VerifyOutcome } from "./publisher";

const verifyWith = (integration: IntegrationCredentials, token: string): Promise<VerifyOutcome> => {
  const request = resolveAdapter(integration.provider).buildVerifyRequest({
    provider: integration.provider,
    repoIdentifier: integration.repoIdentifier,
    token,
  });

  switch (integration.authType) {
    case "access_token":
      return verify(request);
    case "github_app":
      return integration.externalRepoId === null
        ? Promise.resolve({
            ok: false,
            httpStatus: null,
            error: "the integration is missing its repository id",
          })
        : verifyRepository(request, integration.externalRepoId);
  }
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

  // A cached GitHub App token can be revoked before it expires. Retry once with a fresh one.
  const renewed = await credential.renew();
  return renewed.ok ? verifyWith(integration, renewed.token) : failed(renewed);
};
