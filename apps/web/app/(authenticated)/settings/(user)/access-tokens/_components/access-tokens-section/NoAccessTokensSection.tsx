import { Card, CardContent, CardHeader } from "@ovr/ui/components/card";
import { Icon, PlusIcon } from "@ovr/ui/components/icon";
import { Typography } from "@ovr/ui/components/typography";

import { CreateAccessTokenModal } from "../create-access-token/CreateAccessTokenModal";
import { CreateAccessTokenModalButton } from "../create-access-token/CreateAccessTokenModalButton";

export const NoAccessTokensSection = () => (
  <Card className="bg-pixel-grid py-20">
    <CardHeader className="flex justify-center">
      <Typography variant="h2" as="h2">
        no access tokens yet
      </Typography>
    </CardHeader>
    <CardContent className="flex flex-col items-center justify-center gap-6">
      <Typography variant="caption" className="text-sm">
        access tokens let ai agents and other tools read build results on your behalf.
      </Typography>
      <CreateAccessTokenModal
        trigger={
          <CreateAccessTokenModalButton variant="solid" color="accent" size="lg">
            <Icon icon={PlusIcon} />
            create first access token
          </CreateAccessTokenModalButton>
        }
      />
    </CardContent>
  </Card>
);
