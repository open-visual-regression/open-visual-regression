"use client";

import { SettingsSidebarLinks } from "@/lib/components/sidebar/SettingsSidebarLinks";
import { Sidebar } from "@/lib/components/sidebar/Sidebar";

type SettingsSidebarProps = {
  role: string | null | undefined;
  version?: string;
};

const SettingsSidebar = ({ role, version }: SettingsSidebarProps) => (
  <Sidebar version={version}>
    <SettingsSidebarLinks role={role} />
  </Sidebar>
);

export { SettingsSidebar };
export type { SettingsSidebarProps };
