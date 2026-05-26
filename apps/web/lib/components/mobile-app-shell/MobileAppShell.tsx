"use client";

import { useState } from "react";
import { MobileNavBar } from "./MobileNavBar";
import { MobileDrawer, type MobileDrawerProject } from "./MobileDrawer";
import { MobileTabBar, type MobileTabBarTab } from "./MobileTabBar";

type MobileAppShellProps = {
  title: string;
  subtitle?: string;
  trailing?: React.ReactNode;
  projects?: MobileDrawerProject[];
  activeProjectId?: string;
  activeTab?: MobileTabBarTab;
  version?: string;
  children: React.ReactNode;
};

const MobileAppShell = ({
  title,
  subtitle,
  trailing,
  projects = [],
  activeProjectId,
  activeTab,
  version,
  children,
}: MobileAppShellProps) => {
  const [drawerOpen, setDrawerOpen] = useState(false);

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
      <MobileDrawer
        open={drawerOpen}
        projects={projects}
        activeProjectId={activeProjectId}
        version={version}
        onClose={() => setDrawerOpen(false)}
      />
    </div>
  );
};

export { MobileAppShell };
export type { MobileAppShellProps };
