import { resolveCredential, type IntegrationCredentials } from "./credentials";
import { verify, type VerifyOutcome } from "./publisher";
import { getProvider } from "./registry";

export const verifyIntegration = async (
  integration: IntegrationCredentials,
): Promise<VerifyOutcome> => {
  const credential = await resolveCredential(integration);
  if (!credential.ok) {
    return { ok: false, httpStatus: null, error: credential.error };
  }

  const request = getProvider(integration.provider).statuses.buildVerifyRequest(
    integration.repoIdentifier,
    credential.token,
  );
  return verify(request);
};
