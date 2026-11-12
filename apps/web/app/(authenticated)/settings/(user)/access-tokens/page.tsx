import { serverClient } from "@/lib/router";
import { serverError } from "@/lib/utils/errors";

import { AccessTokensSection } from "./_components/access-tokens-section/AccessTokensSection";
import { AccessTokensPageShell } from "./_components/AccessTokensPageShell";

export default async function AccessTokensPage() {
  const [error, result] = await serverClient.accessTokens.list({});

  if (error) {
    serverError(error);
  }

  return (
    <AccessTokensPageShell>
      <AccessTokensSection accessTokens={result.accessTokens} />
    </AccessTokensPageShell>
  );
}
