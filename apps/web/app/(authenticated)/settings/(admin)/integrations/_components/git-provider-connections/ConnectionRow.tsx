import type { GitConnectionSchema } from "@ovr/api/contracts/gitProviders";
import { Badge } from "@ovr/ui/components/badge";
import { Typography } from "@ovr/ui/components/typography";

import { ExternalLink } from "@/lib/components/external-link/ExternalLink";

type ConnectionRowProps = {
  connection: GitConnectionSchema;
};

const describeRepositories = (count: number | null): string | null => {
  if (count === null) {
    return null;
  }
  return count === 1 ? "1 repository" : `${count} repositories`;
};

export const ConnectionRow = ({ connection }: ConnectionRowProps) => {
  const repositories = describeRepositories(connection.repositoryCount);

  return (
    <li className="flex flex-col gap-1 py-3 first:pt-0 last:pb-0 @md:flex-row @md:items-center @md:justify-between">
      <div className="flex flex-wrap items-center gap-2">
        <Typography variant="body">{connection.name}</Typography>
        {connection.description ? (
          <Typography variant="caption">({connection.description})</Typography>
        ) : null}
        {connection.warnings.map((warning) => (
          <Badge key={warning} color="amber">
            {warning}
          </Badge>
        ))}
      </div>
      <div className="flex items-center gap-4">
        {repositories ? <Typography variant="caption">{repositories}</Typography> : null}
        {connection.manageUrl ? (
          <ExternalLink href={connection.manageUrl}>manage</ExternalLink>
        ) : null}
      </div>
    </li>
  );
};
