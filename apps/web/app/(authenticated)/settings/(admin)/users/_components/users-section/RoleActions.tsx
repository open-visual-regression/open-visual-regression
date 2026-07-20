"use client";

import { onError, onSuccess } from "@orpc/client";
import { useServerAction } from "@orpc/react/hooks";
import { useRouter } from "next/navigation";

import { Button } from "@ovr/ui/components/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@ovr/ui/components/dropdown-menu";
import { ChevronDownIcon, Icon } from "@ovr/ui/components/icon";
import { toast } from "@ovr/ui/components/toast";

import { serverClient } from "@/lib/router";

import { RoleBadge, type Role } from "./RoleBadge";

const roles: Role[] = ["admin", "user"];

type RoleActionsProps = {
  userId: string;
  name: string;
  role: Role;
};

export const RoleActions = ({ userId, name, role }: RoleActionsProps) => {
  const router = useRouter();

  const { execute, status } = useServerAction(serverClient.users.changeRole, {
    interceptors: [
      onSuccess(() => router.refresh()),
      onError((err) => {
        toast.error(err.message);
      }),
    ],
  });

  const handleValueChange = (value: string) => {
    if (value !== role) {
      execute({ userId, role: value as Role });
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={<Button variant="ghost" size="sm" disabled={status === "pending"} />}
        aria-label={`change role for ${name}`}
      >
        <RoleBadge role={role} />
        <Icon icon={ChevronDownIcon} size={12} />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="center">
        <DropdownMenuRadioGroup value={role} onValueChange={handleValueChange}>
          {roles.map((option) => (
            <DropdownMenuRadioItem key={option} value={option}>
              {option}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
