import Link from "next/link";

import type { BuildSchema, BuildStatus } from "@ovr/api/contracts/builds";
import { Typography } from "@ovr/ui/components/typography";
import { cn } from "@ovr/ui/lib/utils";

const RECENT_BUILD_ROW_HEIGHT_PX = 44;

type RecentBuildSidebarLinkProps = {
  build: BuildSchema;
  active?: boolean;
  className?: string;
  onClick?: () => void;
};

const BUILD_STATUS_BORDER_CLASS: Record<BuildStatus, string> = {
  queued: "border-ovr-gray",
  processing: "border-ovr-purple",
  needs_review: "border-ovr-accent",
  unchanged: "border-ovr-blue",
  auto_approved: "border-ovr-green",
  approved: "border-ovr-green",
  rejected: "border-ovr-remove",
  error: "border-ovr-remove",
  canceled: "border-ovr-gray",
};

const RecentBuildSidebarLink = ({
  build,
  active,
  className,
  onClick,
}: RecentBuildSidebarLinkProps) => (
  <Link
    href={`/projects/${build.project.id}/builds/${build.id}`}
    onClick={onClick}
    aria-current={active ? "page" : undefined}
    className={cn(
      "shrink-0 overflow-hidden transition-colors no-underline hover:bg-ovr-hover",
      active && "bg-ovr-active",
      className,
    )}
  >
    <div
      className={cn(
        "flex flex-col justify-center pr-3 pl-2.5 py-0.5 border-l-3",
        BUILD_STATUS_BORDER_CLASS[build.status],
      )}
    >
      <Typography variant="body-sm" className="truncate text-ovr-fg-muted">
        {build.project.name} · {build.branch}
      </Typography>
      <Typography className="truncate">{build.name ?? build.commitSha.slice(0, 7)}</Typography>
    </div>
  </Link>
);

export { RecentBuildSidebarLink, RECENT_BUILD_ROW_HEIGHT_PX };
export type { RecentBuildSidebarLinkProps };
