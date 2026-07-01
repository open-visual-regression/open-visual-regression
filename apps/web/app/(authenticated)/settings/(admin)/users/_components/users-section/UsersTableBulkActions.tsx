"use client";

import { type UserSchema } from "@ovr/api/contracts/users";
import { AlertDialogTrigger } from "@ovr/ui/components/alert-dialog";
import { Button } from "@ovr/ui/components/button";
import { Icon, XIcon } from "@ovr/ui/components/icon";
import { Typography } from "@ovr/ui/components/typography";

import { RemoveUsersModal } from "./RemoveUsersModal";

type UsersTableBulkActionsProps = {
  users: UserSchema[];
  onRemovedAction: () => void;
};

export const UsersTableBulkActions = ({ users, onRemovedAction }: UsersTableBulkActionsProps) => {
  const count = users.length;

  return (
    <div className="flex items-center gap-3">
      <Typography variant="body-sm" className="text-ovr-fg-secondary">
        {count} {count === 1 ? "user" : "users"} selected
      </Typography>
      <RemoveUsersModal
        users={users}
        onRemovedAction={onRemovedAction}
        trigger={
          <AlertDialogTrigger render={<Button variant="outline" color="red" size="sm" />}>
            <Icon icon={XIcon} />
            remove
          </AlertDialogTrigger>
        }
      />
    </div>
  );
};
