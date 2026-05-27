import Link from "next/link";
import { Button } from "@ovr/ui/components/button";
import { Icon, GitBranchIcon, SettingsIcon } from "@ovr/ui/components/icon";
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
    <Button variant="ghost" size="icon-sm" render={<Link href="/settings" />} aria-label="Settings">
      <Icon icon={SettingsIcon} size={14} />
    </Button>
    <UserAvatar name={userName} />
  </div>
);

export { NavigationBarActions };
export type { NavigationBarActionsProps };
