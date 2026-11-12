import { type AccessTokenSchema } from "@ovr/api/contracts/accessTokens";
import { ButtonSkeleton } from "@ovr/ui/components/button";
import { Icon, PlusIcon } from "@ovr/ui/components/icon";
import { Typography } from "@ovr/ui/components/typography";

import { CreateAccessTokenModal } from "../create-access-token/CreateAccessTokenModal";
import { CreateAccessTokenModalButton } from "../create-access-token/CreateAccessTokenModalButton";
import { AccessTokensTable, AccessTokensTableSkeleton } from "./AccessTokensTable";
import { NoAccessTokensSection } from "./NoAccessTokensSection";

type AccessTokensSectionProps = {
  accessTokens: AccessTokenSchema[];
};

export const AccessTokensSection = ({ accessTokens }: AccessTokensSectionProps) => (
  <AccessTokensSectionLayout
    action={
      <CreateAccessTokenModal
        trigger={
          <CreateAccessTokenModalButton className={NEW_TOKEN_BUTTON_CLASS_NAME}>
            <Icon icon={PlusIcon} />
            <span className="sr-only sm:not-sr-only">new access token</span>
          </CreateAccessTokenModalButton>
        }
      />
    }
    content={
      accessTokens.length === 0 ? (
        <NoAccessTokensSection />
      ) : (
        <AccessTokensTable data={accessTokens} />
      )
    }
  />
);

const NEW_TOKEN_BUTTON_CLASS_NAME = "w-8 gap-0 px-0 sm:w-auto sm:gap-1 sm:px-3.5";

type AccessTokensSectionLayoutProps = {
  action: React.ReactNode;
  content: React.ReactNode;
};

const AccessTokensSectionLayout = ({ action, content }: AccessTokensSectionLayoutProps) => (
  <div className="flex flex-col gap-4">
    <div className="flex items-center justify-between">
      <Typography variant="h2">access tokens</Typography>
      {action}
    </div>
    {content}
  </div>
);

export const AccessTokensSectionSkeleton = () => (
  <AccessTokensSectionLayout
    action={
      <ButtonSkeleton className={NEW_TOKEN_BUTTON_CLASS_NAME}>
        <Icon icon={PlusIcon} />
        <span className="sr-only sm:not-sr-only">new access token</span>
      </ButtonSkeleton>
    }
    content={<AccessTokensTableSkeleton />}
  />
);
