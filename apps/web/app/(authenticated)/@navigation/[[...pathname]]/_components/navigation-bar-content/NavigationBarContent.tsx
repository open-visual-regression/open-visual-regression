import type { BuildSchema } from "@ovr/api/contracts/builds";
import type { ProjectDto } from "@ovr/api/contracts/projects";
import { Separator } from "@ovr/ui/components/separator";

import type { Role } from "@/lib/auth/roles";
import type { BreadcrumbSegment } from "@/lib/components/navigation-bar/getBreadcrumbSegments";
import { NavigationBar } from "@/lib/components/navigation-bar/NavigationBar";
import { NavigationBarActions } from "@/lib/components/navigation-bar/NavigationBarActions";
import { NavigationBarBreadcrumb } from "@/lib/components/navigation-bar/NavigationBarBreadcrumb";
import { NavigationBarLogo } from "@/lib/components/navigation-bar/NavigationBarLogo";
import { NavigationBarMobileMenu } from "@/lib/components/navigation-bar/NavigationBarMobileMenu";

type NavigationBarContentProps = {
  role: Role;
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
