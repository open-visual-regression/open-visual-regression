import { SettingsIcon, type LucideIcon, UserIcon, UsersIcon } from "@ovr/ui/components/icon";

type SettingsNavItem = {
  href: string;
  icon: LucideIcon;
  label: string;
};

type SettingsNavSection = {
  label: string;
  access: "all" | "admin";
  items: SettingsNavItem[];
};

const SETTINGS_NAV_SECTIONS: SettingsNavSection[] = [
  {
    label: "personal",
    access: "all",
    items: [{ href: "/settings/account", icon: UserIcon, label: "account" }],
  },
  {
    label: "admin",
    access: "admin",
    items: [
      { href: "/settings/organization", icon: SettingsIcon, label: "organization" },
      { href: "/settings/users", icon: UsersIcon, label: "users" },
    ],
  },
];

const isNavItemActive = (pathname: string, href: string) => pathname.startsWith(href);

export { SETTINGS_NAV_SECTIONS, isNavItemActive };
export type { SettingsNavItem, SettingsNavSection };
