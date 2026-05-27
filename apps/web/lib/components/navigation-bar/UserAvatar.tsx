"use client";

import { LogOutIcon } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@ovr/ui/components/dropdown-menu";
import { Button } from "@ovr/ui/components/button";
import { authClient } from "@/lib/auth-client";
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
            variant="secondary"
            className="size-6 text-badge font-semibold rounded-sm"
            aria-label={`User menu for ${name}`}
          />
        }
      >
        {getMonogram(name)}
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
