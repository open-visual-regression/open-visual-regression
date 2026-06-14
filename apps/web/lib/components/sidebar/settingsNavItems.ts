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

const PERSONAL_NAV_ITEMS: SettingsNavItem[] = [
  { href: "/settings/profile", icon: UserIcon, label: "profile" },
];

const ADMIN_NAV_ITEMS: SettingsNavItem[] = [
  { href: "/settings/general", icon: SettingsIcon, label: "general" },
  { href: "/settings/users", icon: UsersIcon, label: "users" },
  { href: "/settings/invitations", icon: MailIcon, label: "invitations" },
];

const isNavItemActive = (pathname: string, href: string) => pathname.startsWith(href);

export { PERSONAL_NAV_ITEMS, ADMIN_NAV_ITEMS, isNavItemActive };
export type { SettingsNavItem };
