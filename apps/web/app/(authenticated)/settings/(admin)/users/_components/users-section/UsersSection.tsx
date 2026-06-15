import { Icon, PlusIcon } from "@ovr/ui/components/icon";
import { Button } from "@ovr/ui/components/button";
import { type UserSchema } from "@ovr/api/contracts/users";
import { UsersTable } from "./UsersTable";

type UsersSectionProps = {
  users: UserSchema[];
};

export const UsersSection = ({ users }: UsersSectionProps) => (
  <div className="flex flex-col gap-4">
    <div className="flex items-center justify-end">
      <Button variant="secondary" disabled>
        <Icon icon={PlusIcon} />
        add user
      </Button>
    </div>
    <UsersTable data={users} />
  </div>
);
