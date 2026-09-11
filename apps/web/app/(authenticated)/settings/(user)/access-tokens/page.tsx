import { Typography } from "@ovr/ui/components/typography";

import { serverClient } from "@/lib/router";
import { serverError } from "@/lib/utils/errors";

import { AccessTokensSection } from "./_components/access-tokens-section/AccessTokensSection";

export default async function AccessTokensPage() {
  const [error, result] = await serverClient.accessTokens.list({});

  if (error) {
    serverError(error);
  }

  return (
    <div className="flex flex-col gap-6">
      <Typography variant="h1" as="h1">
        access tokens
      </Typography>
      <div className="flex w-full flex-col gap-6 md:w-2/3 lg:w-1/2">
        <AccessTokensSection accessTokens={result.accessTokens} />
      </div>
    </div>
  );
}
