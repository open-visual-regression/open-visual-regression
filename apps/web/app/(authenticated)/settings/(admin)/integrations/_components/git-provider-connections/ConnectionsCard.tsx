import type { GitConnectionsStatusSchema } from "@ovr/api/contracts/gitProviders";
import { Badge } from "@ovr/ui/components/badge";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@ovr/ui/components/card";
import { ExternalLinkIcon, Icon } from "@ovr/ui/components/icon";
import { Typography } from "@ovr/ui/components/typography";

import { ButtonLink } from "@/lib/components/button-link/ButtonLink";

import { ConnectionRow } from "./ConnectionRow";

type ConnectionsCardProps = {
  status: Extract<GitConnectionsStatusSchema, { status: "ok" }>;
};

export const ConnectionsCard = ({ status }: ConnectionsCardProps) => {
  const connected = status.connections.length > 0;

  return (
    <Card className="@container">
      <CardHeader>
        <CardTitle>{status.name}</CardTitle>
        {status.description ? <CardDescription>{status.description}</CardDescription> : null}
        <CardAction>
          {connected ? (
            <Badge color="green">connected</Badge>
          ) : (
            <Badge color="amber">not connected</Badge>
          )}
        </CardAction>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {status.warnings.map((warning) => (
          <Typography key={warning} variant="body" as="p" className="text-ovr-red">
            {warning}
          </Typography>
        ))}
        {connected ? (
          <div className="flex flex-col gap-2">
            <Typography variant="label" as="h3">
              connections
            </Typography>
            <ul className="flex flex-col divide-y divide-ovr-border">
              {status.connections.map((connection) => (
                <ConnectionRow key={connection.id} connection={connection} />
              ))}
            </ul>
          </div>
        ) : (
          <Typography variant="body-muted" as="p">
            add a connection, then link projects to the repositories it can reach.
          </Typography>
        )}
      </CardContent>
      {status.addUrl ? (
        <CardFooter className="justify-end">
          <ButtonLink
            href={status.addUrl}
            target="_blank"
            rel="noopener noreferrer"
            variant="outline"
            className="w-full @md:w-auto"
          >
            {connected ? "add another connection" : "add a connection"}
            <Icon icon={ExternalLinkIcon} size={12} />
          </ButtonLink>
        </CardFooter>
      ) : null}
    </Card>
  );
};
