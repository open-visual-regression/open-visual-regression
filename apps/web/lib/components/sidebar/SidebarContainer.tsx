"use client";

import { useState } from "react";
import { Sidebar, type SidebarProps } from "./Sidebar";
import { SidebarCollapsed } from "./SidebarCollapsed";

type SidebarContainerProps = SidebarProps & {
  defaultCollapsed?: boolean;
};

const SidebarContainer = ({ defaultCollapsed = false, ...props }: SidebarContainerProps) => {
  const [collapsed, setCollapsed] = useState(defaultCollapsed);

  if (collapsed) {
    return (
      <SidebarCollapsed
        projects={props.projects}
        activeProjectId={props.activeProjectId}
        onExpand={() => setCollapsed(false)}
      />
    );
  }

  return <Sidebar {...props} onCollapse={() => setCollapsed(true)} />;
};

export { SidebarContainer };
export type { SidebarContainerProps };
