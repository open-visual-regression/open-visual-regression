import { GitBranchIcon, SettingsIcon } from "lucide-react";
import Link from "next/link";
import { Button, buttonVariants } from "@ovr/ui/components/button";
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
      className={buttonVariants({ variant: "ghost", size: "icon-sm" })}
      aria-label="Settings"
    >
      <Icon icon={SettingsIcon} size={14} />
    </Link>
    <UserAvatar name={userName} />
  </div>
);

export { NavigationBarActions };
export type { NavigationBarActionsProps };
