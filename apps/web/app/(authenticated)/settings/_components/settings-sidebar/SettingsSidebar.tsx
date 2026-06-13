"use client";

import { usePathname } from "next/navigation";
import { Icon } from "@ovr/ui/components/icon";
import { RequiresAdminRole } from "@/lib/components/authorization/RequiresAdminRole";
import { Sidebar } from "@/lib/components/sidebar/Sidebar";
import { SidebarCollapsedLink } from "@/lib/components/sidebar/SidebarCollapsedLink";
import { SidebarItem } from "@/lib/components/sidebar/SidebarItem";
import { SidebarSection } from "@/lib/components/sidebar/SidebarSection";
import { ADMIN_NAV_ITEMS, PERSONAL_NAV_ITEMS, isNavItemActive } from "./settingsNavItems";

type SettingsSidebarProps = {
  role: string | null | undefined;
  version?: string;
};

const SettingsSidebar = ({ role, version }: SettingsSidebarProps) => {
  const pathname = usePathname();

  return (
    <Sidebar
      version={version}
      collapseLabel="Collapse settings navigation"
      expandLabel="Expand settings navigation"
      expandedContent={
        <>
          <SidebarSection label="personal">
            {PERSONAL_NAV_ITEMS.map((item) => (
              <SidebarItem
                key={item.href}
                href={item.href}
                icon={item.icon}
                label={item.label}
                active={isNavItemActive(pathname, item.href)}
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
                />
              ))}
            </SidebarSection>
          </RequiresAdminRole>
        </>
      }
      collapsedContent={
        <>
          <div className="flex flex-col pt-3.5">
            {PERSONAL_NAV_ITEMS.map((item) => {
              const active = isNavItemActive(pathname, item.href);
              return (
                <SidebarCollapsedLink
                  key={item.href}
                  href={item.href}
                  title={item.label}
                  active={active}
                >
                  <Icon
                    icon={item.icon}
                    size={14}
                    className={active ? "text-ovr-fg" : "text-ovr-fg-secondary"}
                  />
                </SidebarCollapsedLink>
              );
            })}
          </div>
          <RequiresAdminRole role={role}>
            <div className="flex flex-col border-t border-ovr-border-subtle pt-1.5">
              {ADMIN_NAV_ITEMS.map((item) => {
                const active = isNavItemActive(pathname, item.href);
                return (
                  <SidebarCollapsedLink
                    key={item.href}
                    href={item.href}
                    title={item.label}
                    active={active}
                  >
                    <Icon
                      icon={item.icon}
                      size={14}
                      className={active ? "text-ovr-fg" : "text-ovr-fg-secondary"}
                    />
                  </SidebarCollapsedLink>
                );
              })}
            </div>
          </RequiresAdminRole>
        </>
      }
    />
  );
};

export { SettingsSidebar };
export type { SettingsSidebarProps };
