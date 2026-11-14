import {
  KeyRoundIcon,
  SettingsIcon,
  TimerIcon,
  type LucideIcon,
  UserIcon,
  UsersIcon,
} from "@ovr/ui/components/icon";

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
    label: "Personal",
    access: "all",
    items: [
      { href: "/settings/account", icon: UserIcon, label: "Account" },
      { href: "/settings/access-tokens", icon: KeyRoundIcon, label: "Access tokens" },
    ],
  },
  {
    label: "Admin",
    access: "admin",
    items: [
      { href: "/settings/organization", icon: SettingsIcon, label: "Organization" },
      { href: "/settings/users", icon: UsersIcon, label: "Users" },
      { href: "/settings/jobs", icon: TimerIcon, label: "Jobs" },
    ],
  },
];

const isNavItemActive = (pathname: string, href: string) => pathname.startsWith(href);

export { SETTINGS_NAV_SECTIONS, isNavItemActive };
export type { SettingsNavItem, SettingsNavSection };
