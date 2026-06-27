import Link from "next/link";
import type { BuildSchema, BuildStatus } from "@ovr/api/contracts/builds";
import { cn } from "@ovr/ui/lib/utils";
import { Typography } from "@ovr/ui/components/typography";
import { getBuildDisplayStatus } from "@/lib/router/utils/buildStatus";

const RECENT_BUILD_ROW_HEIGHT_PX = 44;

type RecentBuildSidebarLinkProps = {
  build: BuildSchema;
  className?: string;
  onClick?: () => void;
};

const BUILD_STATUS_BORDER_CLASS: Record<BuildStatus, string> = {
  queued: "border-ovr-gray",
  processing: "border-ovr-purple",
  needs_review: "border-ovr-accent",
  passed: "border-ovr-blue",
  approved: "border-ovr-green",
  rejected: "border-ovr-remove",
  error: "border-ovr-remove",
};

const RecentBuildSidebarLink = ({ build, className, onClick }: RecentBuildSidebarLinkProps) => (
  <Link
    href={`/projects/${build.project.id}/builds/${build.id}`}
    onClick={onClick}
    className={cn(
      "shrink-0 overflow-hidden transition-colors no-underline hover:bg-ovr-hover",
      className,
    )}
  >
    <div
      className={cn(
        "flex flex-col justify-center pr-3 pl-2.5 py-0.5 border-l-3",
        BUILD_STATUS_BORDER_CLASS[getBuildDisplayStatus(build)],
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
