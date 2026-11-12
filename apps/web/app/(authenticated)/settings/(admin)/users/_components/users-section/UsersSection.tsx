import { type UserSchema } from "@ovr/api/contracts/users";
import { ButtonSkeleton } from "@ovr/ui/components/button";
import { Icon, PlusIcon } from "@ovr/ui/components/icon";
import { Typography } from "@ovr/ui/components/typography";

import { SearchFieldSkeleton } from "@/lib/components/SearchField/SearchField";

import { InviteUserModal } from "../invite-user/InviteUserModal";
import { InviteUserModalButton } from "../invite-user/InviteUserModalButton";
import { UsersSearchField } from "./UsersSearchField";
import { UsersTable, UsersTableSkeleton } from "./UsersTable";

type UsersSectionProps = {
  users: UserSchema[];
  currentUserId: string;
  search?: string;
  readOnly?: boolean;
};

export const UsersSection = ({
  users,
  currentUserId,
  search,
  readOnly = false,
}: UsersSectionProps) => (
  <UsersSectionLayout
    search={<UsersSearchField search={search} className="flex-1 sm:w-64 sm:flex-none" />}
    action={
      !readOnly && (
        <InviteUserModal
          trigger={
            <InviteUserModalButton className={INVITE_BUTTON_CLASS_NAME}>
              <Icon icon={PlusIcon} />
              <span className="sr-only sm:not-sr-only">invite user</span>
            </InviteUserModalButton>
          }
        />
      )
    }
    table={
      <UsersTable data={users} currentUserId={currentUserId} search={search} readOnly={readOnly} />
    }
  />
);

const INVITE_BUTTON_CLASS_NAME = "w-8 gap-0 px-0 sm:w-auto sm:gap-1 sm:px-3.5";

type UsersSectionLayoutProps = {
  search: React.ReactNode;
  action: React.ReactNode;
  table: React.ReactNode;
};

const UsersSectionLayout = ({ search, action, table }: UsersSectionLayoutProps) => (
  <div className="flex flex-col gap-6">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <Typography variant="h1" as="h1" className="w-full sm:w-auto">
        users
      </Typography>
      <div className="flex w-full items-center gap-3 sm:w-auto">
        {search}
        {action}
      </div>
    </div>
    {table}
  </div>
);

export const UsersSectionSkeleton = () => (
  <UsersSectionLayout
    search={<SearchFieldSkeleton className="flex-1 sm:w-64 sm:flex-none" />}
    action={
      <ButtonSkeleton className={INVITE_BUTTON_CLASS_NAME}>
        <Icon icon={PlusIcon} />
        <span className="sr-only sm:not-sr-only">invite user</span>
      </ButtonSkeleton>
    }
    table={<UsersTableSkeleton />}
  />
);
