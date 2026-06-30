import Link from "next/link";

import { Button } from "@ovr/ui/components/button";
import { Icon, SettingsIcon } from "@ovr/ui/components/icon";

import { UserAvatar } from "./UserAvatar";

type NavigationBarActionsProps = {
  userName: string;
};

const NavigationBarActions = ({ userName }: NavigationBarActionsProps) => (
  <div className="flex items-center gap-1 shrink-0">
    <Button
      variant="ghost"
      color="neutral"
      size="icon-sm"
      render={<Link href="/settings" />}
      nativeButton={false}
      aria-label="Settings"
    >
      <Icon icon={SettingsIcon} size={14} />
    </Button>
    <UserAvatar name={userName} />
  </div>
);

export { NavigationBarActions };
export type { NavigationBarActionsProps };
