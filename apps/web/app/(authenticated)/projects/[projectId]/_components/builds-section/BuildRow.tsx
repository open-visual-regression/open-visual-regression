import Link from "next/link";

import { type BuildSchema } from "@ovr/api/contracts/builds";
import { Typography } from "@ovr/ui/components/typography";
import { cn } from "@ovr/ui/lib/utils";

import { BUILD_STATUS_BORDER_CLASS, BuildStatusBadge } from "@/lib/components/BuildStatus";
import { MetadataDot } from "@/lib/components/metadata-dot/MetadataDot";
import { TruncatedText } from "@/lib/components/truncated-text/TruncatedText";
import { formatRelativeDateTime } from "@/lib/utils/date";

type BuildRowProps = {
  build: BuildSchema;
};

export const BuildRow = ({ build }: BuildRowProps) => {
  const shortSha = build.commitSha.slice(0, 7);

  return (
    <li>
      <Link
        href={`/projects/${build.project.id}/builds/${build.id}`}
        className={cn(
          "flex min-w-0 flex-col gap-1.5 border-l-3 py-2.5 pr-4 pl-3 no-underline transition-colors",
          "hover:bg-ovr-hover focus-visible:bg-ovr-hover focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ovr-accent",
          BUILD_STATUS_BORDER_CLASS[build.status],
        )}
      >
        <div className="flex min-w-0 items-baseline gap-2">
          <Typography variant="body-muted" className="shrink-0">
            {shortSha}
          </Typography>
          {build.name ? (
            <TruncatedText as={Typography} className="min-w-0 max-w-none w-full flex-1">
              {build.name}
            </TruncatedText>
          ) : null}
        </div>
        <div className="flex flex-row flex-wrap items-center gap-x-5 gap-y-1">
          <BuildStatusBadge status={build.status} size="sm" />
          <div className="flex flex-row flex-wrap items-center gap-x-1.5 gap-y-1">
            <TruncatedText as={Typography} variant="body-muted">
              {build.branch}
            </TruncatedText>
            <MetadataDot />
            <TruncatedText as={Typography} variant="body-muted">
              {build.author ?? "unknown"}
            </TruncatedText>
            <MetadataDot />
            <TruncatedText as={Typography} variant="body-muted">
              {formatRelativeDateTime(new Date(build.createdAt))}
            </TruncatedText>
          </div>
        </div>
      </Link>
    </li>
  );
};
