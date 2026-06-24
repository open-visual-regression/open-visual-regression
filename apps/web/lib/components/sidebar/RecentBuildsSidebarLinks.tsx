import type { BuildSchema } from "@ovr/api/contracts/builds";
import { SidebarSection } from "./SidebarSection";
import { RecentBuildSidebarLink } from "./RecentBuildSidebarLink";
import styles from "./RecentBuildsSidebarLinks.module.css";

const RECENT_BUILDS_FETCH_LIMIT = 20;

type RecentBuildsSidebarLinksProps = {
  builds: Pick<BuildSchema, "id" | "project" | "branch" | "name" | "commitSha" | "status">[];
  onNavigate?: () => void;
};

const RecentBuildsSidebarLinks = ({ builds, onNavigate }: RecentBuildsSidebarLinksProps) => {
  if (builds.length === 0) {
    return null;
  }

  return (
    <SidebarSection label="recent builds" className="min-h-0 flex-1 overflow-hidden">
      <div className={styles.container} data-testid="recent-builds-rows">
        {builds.slice(0, RECENT_BUILDS_FETCH_LIMIT).map((build) => (
          <RecentBuildSidebarLink
            key={build.id}
            build={build}
            className={styles.row}
            onClick={onNavigate}
          />
        ))}
      </div>
    </SidebarSection>
  );
};

export { RecentBuildsSidebarLinks, RECENT_BUILDS_FETCH_LIMIT };
export type { RecentBuildsSidebarLinksProps };
