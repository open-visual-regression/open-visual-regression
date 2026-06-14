"use client";

import { Fragment } from "react";
import { usePathname } from "next/navigation";
import { Icon } from "@ovr/ui/components/icon";
import { RequiresAdminRole } from "@/lib/components/authorization/RequiresAdminRole";
import { Sidebar } from "@/lib/components/sidebar/Sidebar";
import { SidebarCollapsedLink } from "@/lib/components/sidebar/SidebarCollapsedLink";
import { SidebarCollapsedSectionLabel } from "@/lib/components/sidebar/SidebarCollapsedSectionLabel";
import { SETTINGS_NAV_SECTIONS, isNavItemActive } from "@/lib/components/sidebar/settingsNavItems";
import { SettingsSidebarLinks } from "@/lib/components/sidebar/SettingsSidebarLinks";

type SettingsSidebarProps = {
  role: string | null | undefined;
  version?: string;
  initialCollapsed?: boolean;
};

const SettingsSidebar = ({ role, version, initialCollapsed }: SettingsSidebarProps) => {
  const pathname = usePathname();

  return (
    <Sidebar
      version={version}
      initialCollapsed={initialCollapsed}
      collapseLabel="Collapse settings navigation"
      expandLabel="Expand settings navigation"
      expandedContent={<SettingsSidebarLinks role={role} />}
      collapsedContent={
        <>
          {SETTINGS_NAV_SECTIONS.map((section) => {
            const content = (
              <div className="flex flex-col">
                <SidebarCollapsedSectionLabel label={section.collapsedLabel} />
                {section.items.map((item) => {
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
      }
    />
  );
};

export { SettingsSidebar };
export type { SettingsSidebarProps };
