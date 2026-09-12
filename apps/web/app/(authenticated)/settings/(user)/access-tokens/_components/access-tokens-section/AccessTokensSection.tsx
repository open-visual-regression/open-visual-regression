import { type AccessTokenSchema } from "@ovr/api/contracts/accessTokens";
import { Icon, PlusIcon } from "@ovr/ui/components/icon";
import { Typography } from "@ovr/ui/components/typography";

import { CreateAccessTokenModal } from "../create-access-token/CreateAccessTokenModal";
import { CreateAccessTokenModalButton } from "../create-access-token/CreateAccessTokenModalButton";
import { AccessTokensTable } from "./AccessTokensTable";
import { NoAccessTokensSection } from "./NoAccessTokensSection";

type AccessTokensSectionProps = {
  accessTokens: AccessTokenSchema[];
};

export const AccessTokensSection = ({ accessTokens }: AccessTokensSectionProps) => (
  <div className="flex flex-col gap-4">
    <div className="flex items-center justify-between">
      <Typography variant="h2">access tokens</Typography>
      <CreateAccessTokenModal
        trigger={
          <CreateAccessTokenModalButton className="w-8 gap-0 px-0 sm:w-auto sm:gap-1 sm:px-3.5">
            <Icon icon={PlusIcon} />
            <span className="sr-only sm:not-sr-only">new access token</span>
          </CreateAccessTokenModalButton>
        }
      />
    </div>
    {accessTokens.length === 0 ? (
      <NoAccessTokensSection />
    ) : (
      <AccessTokensTable data={accessTokens} />
    )}
  </div>
);
