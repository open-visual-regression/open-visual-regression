import Link from "next/link";

import type { BuildSchema } from "@ovr/api/contracts/builds";
import { Typography } from "@ovr/ui/components/typography";
import { cn } from "@ovr/ui/lib/utils";

import { BUILD_STATUS_BORDER_CLASS } from "@/lib/components/BuildStatus";

const RECENT_BUILD_ROW_HEIGHT_PX = 44;

type RecentBuildSidebarLinkProps = {
  build: BuildSchema;
  active?: boolean;
  className?: string;
  onClick?: () => void;
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
      <Typography variant="body-sm" className="truncate text-ovr-fg-secondary">
        {build.project.name} · {build.branch}
      </Typography>
      <Typography className="truncate">{build.name ?? build.commitSha.slice(0, 7)}</Typography>
    </div>
  </Link>
);

export { RecentBuildSidebarLink, RECENT_BUILD_ROW_HEIGHT_PX };
export type { RecentBuildSidebarLinkProps };
