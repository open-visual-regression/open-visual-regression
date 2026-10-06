import { type UserSchema } from "@ovr/api/contracts/users";
import { Icon, PlusIcon } from "@ovr/ui/components/icon";
import { Skeleton } from "@ovr/ui/components/skeleton";
import { Typography, TypographySkeleton } from "@ovr/ui/components/typography";

import { SearchFieldSkeleton } from "@/lib/components/SearchField/SearchField";

import { InviteUserModal } from "../invite-user/InviteUserModal";
import { InviteUserModalButton } from "../invite-user/InviteUserModalButton";
import { UsersSearchField } from "./UsersSearchField";
import { UsersTable, UsersTableSkeleton } from "./UsersTable";

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
          <UsersSearchField search={search} className="flex-1 sm:w-64 sm:flex-none" />
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

export const UsersSectionSkeleton = () => (
  <div aria-hidden className="flex flex-col gap-6">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <TypographySkeleton variant="h1" className="w-40" />
      <div className="flex w-full items-center gap-3 sm:w-auto">
        <SearchFieldSkeleton className="flex-1 sm:w-64 sm:flex-none" />
        <Skeleton className="h-8 w-8 rounded-lg sm:w-28" />
      </div>
    </div>
    <UsersTableSkeleton />
  </div>
);
