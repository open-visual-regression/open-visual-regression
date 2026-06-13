"use client";

import { useState } from "react";
import { SidebarCollapsed } from "./SidebarCollapsed";
import { SidebarExpanded } from "./SidebarExpanded";

type SidebarProps = {
  version?: string;
  collapseLabel?: string;
  expandLabel?: string;
  defaultCollapsed?: boolean;
  expandedContent: React.ReactNode;
  collapsedContent: React.ReactNode;
};

const Sidebar = ({
  version,
  collapseLabel,
  expandLabel,
  defaultCollapsed = false,
  expandedContent,
  collapsedContent,
}: SidebarProps) => {
  const [collapsed, setCollapsed] = useState(defaultCollapsed);

  if (collapsed) {
    return (
      <SidebarCollapsed expandLabel={expandLabel} onExpand={() => setCollapsed(false)}>
        {collapsedContent}
      </SidebarCollapsed>
    );
  }

  return (
    <SidebarExpanded
      version={version}
      collapseLabel={collapseLabel}
      onCollapse={() => setCollapsed(true)}
    >
      {expandedContent}
    </SidebarExpanded>
  );
};

export { Sidebar };
export type { SidebarProps };
