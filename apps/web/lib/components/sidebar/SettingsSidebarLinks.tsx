"use client";

import { usePathname } from "next/navigation";
import { Fragment } from "react";

import { RequiresAdminRole } from "@/lib/components/authorization/RequiresAdminRole";
import { SidebarItem } from "@/lib/components/sidebar/SidebarItem";
import { SidebarSection } from "@/lib/components/sidebar/SidebarSection";

import { SETTINGS_NAV_SECTIONS, isNavItemActive } from "./settingsNavItems";

type SettingsSidebarLinksProps = {
  role: string | null | undefined;
  onNavigate?: () => void;
};

const SettingsSidebarLinks = ({ role, onNavigate }: SettingsSidebarLinksProps) => {
  const pathname = usePathname();

  return (
    <>
      {SETTINGS_NAV_SECTIONS.map((section) => {
        const content = (
          <SidebarSection label={section.label}>
            {section.items.map((item) => (
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
        );

        if (section.access !== "admin") {
          return <Fragment key={section.label}>{content}</Fragment>;
        }

        return (
          <RequiresAdminRole key={section.label} role={role}>
            {content}
          </RequiresAdminRole>
        );
      })}
    </>
  );
};

export { SettingsSidebarLinks };
export type { SettingsSidebarLinksProps };
