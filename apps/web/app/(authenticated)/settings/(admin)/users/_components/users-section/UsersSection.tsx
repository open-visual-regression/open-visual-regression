import { Icon, PlusIcon } from "@ovr/ui/components/icon";
import { Typography } from "@ovr/ui/components/typography";
import { type UserSchema } from "@ovr/api/contracts/users";
import { InviteUserModal } from "../invite-user/InviteUserModal";
import { InviteUserModalButton } from "../invite-user/InviteUserModalButton";
import { UsersTable } from "./UsersTable";

type UsersSectionProps = {
  users: UserSchema[];
};

export const UsersSection = ({ users }: UsersSectionProps) => (
  <div className="flex flex-col gap-6">
    <div className="flex items-center justify-between">
      <Typography variant="h1" as="h1">
        users
      </Typography>
      <InviteUserModal
        trigger={
          <InviteUserModalButton>
            <Icon icon={PlusIcon} />
            add user
          </InviteUserModalButton>
        }
      />
    </div>
    <UsersTable data={users} />
  </div>
);
