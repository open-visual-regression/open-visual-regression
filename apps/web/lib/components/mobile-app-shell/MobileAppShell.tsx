"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { MobileNavBar } from "./MobileNavBar";
import { MobileDrawer, type MobileDrawerProject } from "./MobileDrawer";
import { MobileTabBar, type MobileTabBarTab } from "./MobileTabBar";

type MobileAppShellProps = {
  title: string;
  subtitle?: string;
  trailing?: React.ReactNode;
  projects?: MobileDrawerProject[];
  activeProjectId?: string;
  version?: string;
  children: React.ReactNode;
};

const getActiveTab = (pathname: string): MobileTabBarTab => {
  if (pathname.startsWith("/settings")) return "settings";
  if (pathname.startsWith("/runs")) return "runs";
  return "projects";
};

const MobileAppShell = ({
  title,
  subtitle,
  trailing,
  projects = [],
  activeProjectId,
  version,
  children,
}: MobileAppShellProps) => {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const pathname = usePathname();
  const activeTab = getActiveTab(pathname);

  return (
    <div className="relative w-full h-full bg-background flex flex-col overflow-hidden">
      <MobileNavBar
        title={title}
        subtitle={subtitle}
        trailing={trailing}
        onMenu={() => setDrawerOpen(true)}
      />
      <div className="flex-1 overflow-auto min-h-0">{children}</div>
      <MobileTabBar active={activeTab} />
      {drawerOpen ? (
        <MobileDrawer
          projects={projects}
          activeProjectId={activeProjectId}
          version={version}
          onClose={() => setDrawerOpen(false)}
        />
      ) : null}
    </div>
  );
};

export { MobileAppShell };
export type { MobileAppShellProps };
