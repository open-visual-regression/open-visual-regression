import { resolveAdapter } from "../adapters";
import { tryDecryptToken } from "../crypto";
import { verify } from "../publisher";
import type { AuthMethod, IntegrationAuth, ResolvedToken } from "./types";

const resolveToken = async ({ encryptedToken }: IntegrationAuth): Promise<ResolvedToken> => {
  if (encryptedToken === null) {
    return { ok: false, error: "no access token is stored, enter one", retryable: false };
  }

  const token = tryDecryptToken(encryptedToken);
  if (token === null) {
    return {
      ok: false,
      error: "stored token could not be decrypted, re-enter it",
      retryable: false,
    };
  }

  return { ok: true, token };
};

export const staticTokenAuth: AuthMethod = {
  resolveToken,
  verify: async (integration) => {
    const resolved = await resolveToken(integration);
    if (!resolved.ok) {
      return { ok: false, httpStatus: null, error: resolved.error };
    }

    const request = resolveAdapter(integration.provider).buildVerifyRequest({
      provider: integration.provider,
      repoIdentifier: integration.repoIdentifier,
      token: resolved.token,
    });
    return verify(request);
  },
};
