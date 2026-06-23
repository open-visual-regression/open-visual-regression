"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { ProjectDto } from "@ovr/api/contracts/projects";
import { Button } from "@ovr/ui/components/button";
import { Icon, MenuIcon } from "@ovr/ui/components/icon";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@ovr/ui/components/sheet";
import { ProjectsSidebarLinks } from "@/lib/components/sidebar/ProjectsSidebarLinks";
import { SettingsSidebarLinks } from "@/lib/components/sidebar/SettingsSidebarLinks";

type NavigationBarMobileMenuProps = {
  role: string | null | undefined;
  projects: Pick<ProjectDto, "id" | "name">[];
  projectsTotal: number;
};

const NavigationBarMobileMenu = ({
  role,
  projects,
  projectsTotal,
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
        render={<Button variant="ghost" size="icon-sm" className="md:hidden" />}
        aria-label={`Open ${section} navigation`}
      >
        <Icon icon={MenuIcon} size={14} />
      </SheetTrigger>
      <SheetContent side="left" className="gap-0 bg-background p-0">
        <SheetTitle className="sr-only">{section} navigation</SheetTitle>
        {section === "settings" ? (
          <SettingsSidebarLinks role={role} onNavigate={onNavigate} />
        ) : (
          <ProjectsSidebarLinks projects={projects} total={projectsTotal} onNavigate={onNavigate} />
        )}
      </SheetContent>
    </Sheet>
  );
};

export { NavigationBarMobileMenu };
export type { NavigationBarMobileMenuProps };
