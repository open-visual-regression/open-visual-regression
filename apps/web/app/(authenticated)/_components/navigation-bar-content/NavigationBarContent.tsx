import type { BuildSchema } from "@ovr/api/contracts/builds";
import type { ProjectDto } from "@ovr/api/contracts/projects";
import { Separator } from "@ovr/ui/components/separator";

import type { Role } from "@/lib/auth/roles";
import { NavigationBar } from "@/lib/components/navigation-bar/NavigationBar";
import { NavigationBarActions } from "@/lib/components/navigation-bar/NavigationBarActions";
import { NavigationBarLogo } from "@/lib/components/navigation-bar/NavigationBarLogo";
import { NavigationBarMobileMenu } from "@/lib/components/navigation-bar/NavigationBarMobileMenu";

type NavigationBarContentProps = {
  role: Role;
  projects: Pick<ProjectDto, "id" | "name">[];
  projectsTotal: number;
  builds: BuildSchema[];
  breadcrumb: React.ReactNode;
  userName: string;
  signOutUrl?: string;
};

const NavigationBarContent = ({
  role,
  projects,
  projectsTotal,
  builds,
  breadcrumb,
  userName,
  signOutUrl,
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
      {breadcrumb}
    </div>
    <NavigationBarActions userName={userName} signOutUrl={signOutUrl} />
  </NavigationBar>
);

export { NavigationBarContent };
export type { NavigationBarContentProps };
