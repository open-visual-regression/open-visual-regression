import { FolderIcon, GitCommitHorizontalIcon, SettingsIcon } from "lucide-react";
import { MobileTabBarItem } from "./MobileTabBarItem";

type MobileTabBarTab = "projects" | "runs" | "settings";

type MobileTabBarProps = {
  active?: MobileTabBarTab;
};

const tabs: Array<{ id: MobileTabBarTab; href: string; icon: typeof FolderIcon; label: string }> = [
  { id: "projects", href: "/projects", icon: FolderIcon, label: "projects" },
  { id: "runs", href: "/runs", icon: GitCommitHorizontalIcon, label: "runs" },
  { id: "settings", href: "/settings", icon: SettingsIcon, label: "settings" },
];

const MobileTabBar = ({ active }: MobileTabBarProps) => (
  <div className="h-14 shrink-0 flex bg-background border-t border-ovr-border">
    {tabs.map((t) => (
      <MobileTabBarItem
        key={t.id}
        href={t.href}
        icon={t.icon}
        label={t.label}
        active={t.id === active}
      />
    ))}
  </div>
);

export { MobileTabBar };
export type { MobileTabBarProps, MobileTabBarTab };
