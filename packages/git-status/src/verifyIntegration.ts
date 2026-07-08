import { resolveAdapter } from "./adapters";
import { verify, type AdapterConfig, type VerifyOutcome } from "./publisher";

export const verifyIntegration = async (config: AdapterConfig): Promise<VerifyOutcome> => {
  const request = resolveAdapter(config.provider).buildVerifyRequest(config);
  return verify(request);
};
