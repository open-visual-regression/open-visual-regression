"use client";

import { useViewerRole } from "@/lib/providers/ViewerRoleProvider";

import { SettingsSidebar } from "./SettingsSidebar";

type SettingsSidebarContainerProps = {
  version?: string;
};

const SettingsSidebarContainer = ({ version }: SettingsSidebarContainerProps) => (
  <SettingsSidebar role={useViewerRole()} version={version} />
);

export { SettingsSidebarContainer };
export type { SettingsSidebarContainerProps };
