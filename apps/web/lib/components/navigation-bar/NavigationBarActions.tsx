import { GitBranchIcon, SettingsIcon } from "lucide-react";
import Link from "next/link";
import { Button } from "@ovr/ui/components/button";
import { Icon } from "@ovr/ui/components/icon";
import { UserAvatar } from "./UserAvatar";

type NavigationBarActionsProps = {
  userName: string;
  branch?: string;
};

const NavigationBarActions = ({ userName, branch = "main" }: NavigationBarActionsProps) => (
  <div className="flex items-center gap-1 shrink-0">
    <Button variant="ghost" size="sm">
      <Icon icon={GitBranchIcon} size={12} />
      {branch}
    </Button>
    <Link
      href="/settings"
      className="size-7 inline-flex items-center justify-center rounded-lg text-ovr-fg-secondary hover:bg-ovr-hover hover:text-ovr-fg transition-colors"
      aria-label="Settings"
    >
      <Icon icon={SettingsIcon} size={14} />
    </Link>
    <UserAvatar name={userName} />
  </div>
);

export { NavigationBarActions };
export type { NavigationBarActionsProps };
