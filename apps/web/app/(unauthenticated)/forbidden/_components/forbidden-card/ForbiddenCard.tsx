import { Card, CardContent, CardFooter, CardHeader } from "@ovr/ui/components/card";
import { Typography } from "@ovr/ui/components/typography";

import { ExternalLink } from "@/lib/components/external-link/ExternalLink";
import type { ForbiddenReason } from "@/lib/utils/redirects";

const MESSAGES: Record<ForbiddenReason, string> = {
  "no-role": "you are not in any of the groups that grant access to OVR.",
  unverified: "your identity could not be verified. try again, or contact your administrator.",
};

type ForbiddenCardProps = {
  reason: ForbiddenReason;
  email?: string;
  accessRequestUrl?: string;
};

export const ForbiddenCard = ({ reason, email, accessRequestUrl }: ForbiddenCardProps) => (
  <Card className="w-full">
    <CardHeader>
      <Typography variant="h2" as="h1">
        you don&apos;t have access
      </Typography>
    </CardHeader>
    <CardContent className="flex flex-col gap-2">
      <Typography variant="body" as="p">
        {MESSAGES[reason]}
      </Typography>
      {email && (
        <Typography variant="body-muted" as="p">
          signed in as {email}
        </Typography>
      )}
    </CardContent>
    {accessRequestUrl && reason === "no-role" && (
      <CardFooter>
        <ExternalLink href={accessRequestUrl}>request access</ExternalLink>
      </CardFooter>
    )}
  </Card>
);
