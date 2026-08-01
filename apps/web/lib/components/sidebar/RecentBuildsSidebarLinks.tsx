"use client";

import { usePathname } from "next/navigation";

import type { BuildSchema } from "@ovr/api/contracts/builds";

import { RecentBuildSidebarLink } from "./RecentBuildSidebarLink";
import { SidebarSection } from "./SidebarSection";

const RECENT_BUILDS_FETCH_LIMIT = 15;

type RecentBuildsSidebarLinksProps = {
  builds: BuildSchema[];
  onNavigate?: () => void;
};

const isBuildActive = (pathname: string, projectId: string, buildId: string) =>
  pathname.startsWith(`/projects/${projectId}/builds/${buildId}`);

const RecentBuildsSidebarLinks = ({ builds, onNavigate }: RecentBuildsSidebarLinksProps) => {
  const pathname = usePathname();

  if (builds.length === 0) {
    return null;
  }

  return (
    <SidebarSection label="recent builds" className="min-h-0 flex-1">
      <div className="flex flex-col gap-0.5 overflow-auto">
        {builds.slice(0, RECENT_BUILDS_FETCH_LIMIT).map((build) => (
          <RecentBuildSidebarLink
            key={build.id}
            build={build}
            active={isBuildActive(pathname, build.project.id, build.id)}
            onClick={onNavigate}
          />
        ))}
      </div>
    </SidebarSection>
  );
};

export { RecentBuildsSidebarLinks, RECENT_BUILDS_FETCH_LIMIT, isBuildActive };
export type { RecentBuildsSidebarLinksProps };
