"use client";

import { useEffect, useState } from "react";
import { useSidebarStore } from "@/lib/stores/sidebarStore";
import { SidebarCollapsed } from "./SidebarCollapsed";
import { SidebarExpanded } from "./SidebarExpanded";

type SidebarProps = {
  version?: string;
  collapseLabel?: string;
  expandLabel?: string;
  initialCollapsed?: boolean;
  expandedContent: React.ReactNode;
  collapsedContent: React.ReactNode;
};

const Sidebar = ({
  version,
  collapseLabel,
  expandLabel,
  initialCollapsed = false,
  expandedContent,
  collapsedContent,
}: SidebarProps) => {
  const collapsed = useSidebarStore((state) => state.collapsed);
  const setCollapsed = useSidebarStore((state) => state.setCollapsed);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    void Promise.resolve(useSidebarStore.persist.rehydrate()).then(() => setHydrated(true));
  }, []);

  const isCollapsed = hydrated ? collapsed : initialCollapsed;

  if (isCollapsed) {
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
