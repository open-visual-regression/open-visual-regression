"use client";

import { usePathname } from "next/navigation";
import { RequiresAdminRole } from "@/lib/components/authorization/RequiresAdminRole";
import { SidebarItem } from "@/lib/components/sidebar/SidebarItem";
import { SidebarSection } from "@/lib/components/sidebar/SidebarSection";
import { ADMIN_NAV_ITEMS, PERSONAL_NAV_ITEMS, isNavItemActive } from "./settingsNavItems";

type SettingsSidebarLinksProps = {
  role: string | null | undefined;
  onNavigate?: () => void;
};

const SettingsSidebarLinks = ({ role, onNavigate }: SettingsSidebarLinksProps) => {
  const pathname = usePathname();

  return (
    <>
      <SidebarSection label="personal">
        {PERSONAL_NAV_ITEMS.map((item) => (
          <SidebarItem
            key={item.href}
            href={item.href}
            icon={item.icon}
            label={item.label}
            active={isNavItemActive(pathname, item.href)}
            onClick={onNavigate}
          />
        ))}
      </SidebarSection>
      <RequiresAdminRole role={role}>
        <SidebarSection label="admin">
          {ADMIN_NAV_ITEMS.map((item) => (
            <SidebarItem
              key={item.href}
              href={item.href}
              icon={item.icon}
              label={item.label}
              active={isNavItemActive(pathname, item.href)}
              onClick={onNavigate}
            />
          ))}
        </SidebarSection>
      </RequiresAdminRole>
    </>
  );
};

export { SettingsSidebarLinks };
export type { SettingsSidebarLinksProps };
