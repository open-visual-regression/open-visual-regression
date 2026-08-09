import type { BuildSchema } from "@ovr/api/contracts/builds";
import type { ProjectDto } from "@ovr/api/contracts/projects";
import { Separator } from "@ovr/ui/components/separator";

import type { BreadcrumbSegment } from "./getBreadcrumbSegments";
import { NavigationBar } from "./NavigationBar";
import { NavigationBarActions } from "./NavigationBarActions";
import { NavigationBarBreadcrumb } from "./NavigationBarBreadcrumb";
import { NavigationBarLogo } from "./NavigationBarLogo";
import { NavigationBarMobileMenu } from "./NavigationBarMobileMenu";

type NavigationBarContentProps = {
  role: string | null | undefined;
  projects: Pick<ProjectDto, "id" | "name">[];
  projectsTotal: number;
  builds: BuildSchema[];
  segments: BreadcrumbSegment[];
  userName: string;
};

const NavigationBarContent = ({
  role,
  projects,
  projectsTotal,
  builds,
  segments,
  userName,
}: NavigationBarContentProps) => (
  <NavigationBar className="flex flex-row items-center justify-between gap-3">
    <div className="flex min-w-0 flex-row items-center gap-3">
      <NavigationBarMobileMenu
        role={role}
        projects={projects}
        projectsTotal={projectsTotal}
        builds={builds}
      />
      <NavigationBarLogo />
      <Separator orientation="vertical" className="h-5" />
      <NavigationBarBreadcrumb segments={segments} />
    </div>
    <NavigationBarActions userName={userName} />
  </NavigationBar>
);

export { NavigationBarContent };
export type { NavigationBarContentProps };
