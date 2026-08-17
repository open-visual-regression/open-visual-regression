import { Icon, GitCommitHorizontalIcon } from "@ovr/ui/components/icon";
import { Typography } from "@ovr/ui/components/typography";

import { ExternalLink } from "@/lib/components/external-link/ExternalLink";

export type BaselineCommitLinkProps = {
  commitSha: string | null;
  commitUrl: string | null;
};

export const BaselineCommitLink = ({ commitSha, commitUrl }: BaselineCommitLinkProps) => {
  if (!commitSha) {
    return null;
  }

  return commitUrl ? (
    <ExternalLink href={commitUrl}>
      <Icon icon={GitCommitHorizontalIcon} size={10} />
      {commitSha.slice(0, 7)}
    </ExternalLink>
  ) : (
    <Typography variant="caption" className="flex items-center gap-1">
      <Icon icon={GitCommitHorizontalIcon} size={10} />
      {commitSha.slice(0, 7)}
    </Typography>
  );
};
