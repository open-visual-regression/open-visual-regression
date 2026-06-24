import Link from "next/link";
import type { BuildSchema } from "@ovr/api/contracts/builds";
import { cn } from "@ovr/ui/lib/utils";
import { BUILD_STATUS_COLOR_CLASS } from "@/lib/components/BuildStatus";

const RECENT_BUILD_ROW_HEIGHT_PX = 44;

type RecentBuildSidebarLinkProps = {
  build: Pick<BuildSchema, "id" | "project" | "branch" | "name" | "commitSha" | "status">;
  className?: string;
  onClick?: () => void;
};

const RecentBuildSidebarLink = ({ build, className, onClick }: RecentBuildSidebarLinkProps) => (
  <Link
    href={`/projects/${build.project.id}/builds/${build.id}`}
    onClick={onClick}
    className={cn(
      "relative flex h-11 flex-col justify-center gap-0.5 overflow-hidden pl-4 pr-3 transition-colors no-underline hover:bg-ovr-hover",
      className,
    )}
  >
    <span
      aria-hidden
      className={cn(
        "absolute top-1/2 left-2 h-5 w-0.5 -translate-y-1/2 rounded-full",
        BUILD_STATUS_COLOR_CLASS[build.status],
      )}
    />
    <span className="truncate text-badge text-ovr-fg-muted">
      {build.project.name} · {build.branch}
    </span>
    <span className="truncate text-body text-ovr-fg">
      {build.name ?? build.commitSha.slice(0, 7)}
    </span>
  </Link>
);

export { RecentBuildSidebarLink, RECENT_BUILD_ROW_HEIGHT_PX };
export type { RecentBuildSidebarLinkProps };
