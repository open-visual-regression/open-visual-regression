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

import { type Role } from "./role";

const roles: Role[] = ["admin", "user"];

type RoleActionsProps = {
  userId: string;
  name: string;
  role: Role;
  disabled?: boolean;
};

export const RoleActions = ({ userId, name, role, disabled = false }: RoleActionsProps) => {
  const router = useRouter();

  const { execute, status } = useServerAction(serverClient.users.changeRole, {
    interceptors: [
      onSuccess(() => router.refresh()),
      onError((err) => {
        toast.error(err.message);
      }),
    ],
  });

  const handleValueChange = (value: Role) => {
    if (value !== role) {
      execute({ userId, role: value });
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant="outline"
            color="neutral"
            size="sm"
            disabled={disabled || status === "pending"}
            className="w-full justify-between"
          />
        }
        aria-label={`change role for ${name}`}
      >
        {role}
        <Icon icon={ChevronDownIcon} size={12} />
      </DropdownMenuTrigger>
      <DropdownMenuContent>
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
