"use client";

import { LogOutIcon } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@ovr/ui/components/dropdown-menu";
import { authClient } from "@/lib/auth-client";

type UserAvatarProps = {
  name: string;
};

const UserAvatar = ({ name }: UserAvatarProps) => {
  const monogram = name
    .split(/[\s-_]+/)
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toLowerCase();

  const handleSignOut = async () => {
    await authClient.signOut({
      fetchOptions: {
        onSuccess: () => {
          window.location.href = "/login";
        },
      },
    });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <button
            className="size-6 rounded-sm bg-ovr-elevated border border-ovr-border flex items-center justify-center text-badge font-semibold text-ovr-fg-secondary hover:bg-ovr-hover transition-colors"
            aria-label={`User menu for ${name}`}
          />
        }
      >
        {monogram}
      </DropdownMenuTrigger>
      <DropdownMenuContent side="bottom" align="end">
        <DropdownMenuItem onSelect={handleSignOut}>
          <LogOutIcon />
          sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export { UserAvatar };
export type { UserAvatarProps };
