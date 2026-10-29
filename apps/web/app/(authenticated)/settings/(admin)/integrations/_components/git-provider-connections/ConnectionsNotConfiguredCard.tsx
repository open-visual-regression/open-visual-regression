import { Card, CardDescription, CardFooter, CardHeader, CardTitle } from "@ovr/ui/components/card";

import { ExternalLink } from "@/lib/components/external-link/ExternalLink";

type ConnectionsNotConfiguredCardProps = {
  label: string;
  setupGuideUrl: string;
};

export const ConnectionsNotConfiguredCard = ({
  label,
  setupGuideUrl,
}: ConnectionsNotConfiguredCardProps) => (
  <Card>
    <CardHeader>
      <CardTitle>not configured</CardTitle>
      <CardDescription>
        set up a {label} so projects can post commit statuses without personal access tokens.
      </CardDescription>
    </CardHeader>
    <CardFooter className="justify-end">
      <ExternalLink href={setupGuideUrl}>read the setup guide</ExternalLink>
    </CardFooter>
  </Card>
);
