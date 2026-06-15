"use client";

import { Icon, PlusIcon } from "@ovr/ui/components/icon";
import { Typography } from "@ovr/ui/components/typography";
import { type UserSchema } from "@ovr/api/contracts/users";
import { InviteUserModal } from "../invite-user/InviteUserModal";
import { InviteUserModalButton } from "../invite-user/InviteUserModalButton";
import { UsersSearchField } from "./UsersSearchField";
import { UsersTable } from "./UsersTable";

type UsersSectionProps = {
  users: UserSchema[];
  currentUserId: string;
  search?: string;
};

export const UsersSection = ({ users, currentUserId, search }: UsersSectionProps) => {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Typography variant="h1" as="h1" className="w-full sm:w-auto">
          users
        </Typography>
        <div className="flex w-full items-center gap-3 sm:w-auto">
          <UsersSearchField className="flex-1 sm:w-64 sm:flex-none" />
          <InviteUserModal
            trigger={
              <InviteUserModalButton className="w-8 gap-0 px-0 sm:w-auto sm:gap-1 sm:px-3.5">
                <Icon icon={PlusIcon} />
                <span className="sr-only sm:not-sr-only">invite user</span>
              </InviteUserModalButton>
            }
          />
        </div>
      </div>
      <UsersTable data={users} currentUserId={currentUserId} search={search} />
    </div>
  );
};
