"use client";

import Link from "next/link";

import { Button } from "@ovr/ui/components/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@ovr/ui/components/dropdown-menu";
import { Icon, LogOutIcon, SettingsIcon } from "@ovr/ui/components/icon";

import { authClient } from "@/lib/auth/client";
import { getMonogram } from "@/lib/utils/monogram";

type UserAvatarProps = {
  name: string;
};

const UserAvatar = ({ name }: UserAvatarProps) => {
  const handleSignOut = async () => {
    await authClient.signOut({
      fetchOptions: {
        onSuccess: () => {
          window.location.href = "/login";
        },
        onError: () => {
          window.location.href = "/login";
        },
      },
    });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant="outline"
            color="neutral"
            className="size-7 text-badge font-semibold rounded-sm"
            aria-label={`User menu for ${name}`}
          />
        }
      >
        {getMonogram(name)}
      </DropdownMenuTrigger>
      <DropdownMenuContent side="bottom" align="end">
        <DropdownMenuItem render={<Link href="/settings" />}>
          <Icon icon={SettingsIcon} size={14} />
          settings
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleSignOut}>
          <Icon icon={LogOutIcon} size={14} />
          sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export { UserAvatar };
export type { UserAvatarProps };
