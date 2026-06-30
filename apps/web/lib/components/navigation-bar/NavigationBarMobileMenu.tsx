"use client";

import { BuildSchema } from "@ovr/api/contracts/builds";
import { ProjectDto } from "@ovr/api/contracts/projects";
import { Button } from "@ovr/ui/components/button";
import { Icon, MenuIcon } from "@ovr/ui/components/icon";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@ovr/ui/components/sheet";
import { usePathname } from "next/navigation";
import { useState } from "react";

import { ProjectsSidebarLinks } from "@/lib/components/sidebar/ProjectsSidebarLinks";
import { RecentBuildsSidebarLinks } from "@/lib/components/sidebar/RecentBuildsSidebarLinks";
import { SettingsSidebarLinks } from "@/lib/components/sidebar/SettingsSidebarLinks";

type NavigationBarMobileMenuProps = {
  role: string | null | undefined;
  projects: Pick<ProjectDto, "id" | "name">[];
  projectsTotal: number;
  builds: BuildSchema[];
};

const NavigationBarMobileMenu = ({
  role,
  projects,
  projectsTotal,
  builds,
}: NavigationBarMobileMenuProps) => {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const section = pathname.startsWith("/settings")
    ? "settings"
    : pathname.startsWith("/projects")
      ? "projects"
      : null;

  if (!section) {
    return null;
  }

  const onNavigate = () => setOpen(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        render={<Button variant="ghost" color="neutral" size="icon-sm" className="md:hidden" />}
        aria-label={`Open ${section} navigation`}
      >
        <Icon icon={MenuIcon} size={14} />
      </SheetTrigger>
      <SheetContent side="left" className="gap-0 bg-background p-0">
        <SheetTitle className="sr-only">{section} navigation</SheetTitle>
        {section === "settings" ? (
          <SettingsSidebarLinks role={role} onNavigate={onNavigate} />
        ) : (
          <div className="flex min-h-0 flex-1 flex-col">
            <ProjectsSidebarLinks
              projects={projects}
              total={projectsTotal}
              onNavigate={onNavigate}
            />
            <RecentBuildsSidebarLinks builds={builds} onNavigate={onNavigate} />
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
};

export { NavigationBarMobileMenu };
export type { NavigationBarMobileMenuProps };
