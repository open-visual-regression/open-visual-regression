import { FolderIcon, GitCommitHorizontalIcon, SettingsIcon } from "lucide-react";
import { MobileTabBarItem } from "./MobileTabBarItem";

type MobileTabBarTab = "projects" | "runs" | "settings";

type MobileTabBarProps = {
  active?: MobileTabBarTab;
  onTabChange?: (tab: MobileTabBarTab) => void;
};

const tabs: Array<{ id: MobileTabBarTab; icon: typeof FolderIcon; label: string }> = [
  { id: "projects", icon: FolderIcon, label: "projects" },
  { id: "runs", icon: GitCommitHorizontalIcon, label: "runs" },
  { id: "settings", icon: SettingsIcon, label: "settings" },
];

const MobileTabBar = ({ active, onTabChange }: MobileTabBarProps) => (
  <div className="h-14 shrink-0 flex bg-background border-t border-ovr-border">
    {tabs.map((t) => (
      <MobileTabBarItem
        key={t.id}
        icon={t.icon}
        label={t.label}
        active={t.id === active}
        onClick={() => onTabChange?.(t.id)}
      />
    ))}
  </div>
);

export { MobileTabBar };
export type { MobileTabBarProps, MobileTabBarTab };
