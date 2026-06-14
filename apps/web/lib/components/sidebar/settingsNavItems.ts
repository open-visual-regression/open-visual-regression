import {
  SettingsIcon,
  type LucideIcon,
  UserIcon,
  UsersIcon,
  MailIcon,
} from "@ovr/ui/components/icon";

type SettingsNavItem = {
  href: string;
  icon: LucideIcon;
  label: string;
};

type SettingsNavSection = {
  label: string;
  collapsedLabel: string;
  access: "all" | "admin";
  items: SettingsNavItem[];
};

const SETTINGS_NAV_SECTIONS: SettingsNavSection[] = [
  {
    label: "personal",
    collapsedLabel: "per",
    access: "all",
    items: [{ href: "/settings/account", icon: UserIcon, label: "account" }],
  },
  {
    label: "admin",
    collapsedLabel: "adm",
    access: "admin",
    items: [
      { href: "/settings/general", icon: SettingsIcon, label: "general" },
      { href: "/settings/users", icon: UsersIcon, label: "users" },
      { href: "/settings/invitations", icon: MailIcon, label: "invitations" },
    ],
  },
];

const isNavItemActive = (pathname: string, href: string) => pathname.startsWith(href);

export { SETTINGS_NAV_SECTIONS, isNavItemActive };
export type { SettingsNavItem, SettingsNavSection };
