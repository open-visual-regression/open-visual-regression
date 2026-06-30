"use client";

import { onError, onSuccess } from "@orpc/client";
import { useServerAction } from "@orpc/react/hooks";
import { type UserSchema, type RemoveUserInputSchema } from "@ovr/api/contracts/users";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@ovr/ui/components/alert-dialog";
import { FieldError } from "@ovr/ui/components/field";
import { Typography } from "@ovr/ui/components/typography";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { serverClient } from "@/lib/router";

const toRemoveUserInput = (user: UserSchema): RemoveUserInputSchema =>
  user.status === "invited"
    ? { status: "invited", invitationId: user.id }
    : { status: "active", email: user.email };

type RemoveUsersModalProps = {
  trigger: React.ReactNode;
  users: UserSchema[];
  onRemovedAction: () => void;
};

export const RemoveUsersModal = ({ trigger, users, onRemovedAction }: RemoveUsersModalProps) => {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<{ message: string } | null>(null);

  const { execute, status } = useServerAction(serverClient.users.remove, {
    interceptors: [
      onSuccess(() => {
        setOpen(false);
        onRemovedAction();
        router.refresh();
      }),
      onError((err) => setError({ message: err.message })),
    ],
  });

  const handleOpenChange = (nextOpen: boolean) => {
    if (nextOpen) {
      setError(null);
    }
    setOpen(nextOpen);
  };

  const isRemoving = status === "pending";
  const count = users.length;

  return (
    <AlertDialog open={open} onOpenChange={handleOpenChange}>
      {trigger}
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            remove {count} {count === 1 ? "user" : "users"}?
          </AlertDialogTitle>
          <AlertDialogDescription>this cannot be undone.</AlertDialogDescription>
        </AlertDialogHeader>
        <Typography>
          active users will be removed from this organization and pending invitations will be
          cancelled.
        </Typography>
        <FieldError errors={[error]} />
        <AlertDialogFooter>
          <AlertDialogCancel>cancel</AlertDialogCancel>
          <AlertDialogAction
            variant="outline"
            color="red"
            disabled={isRemoving}
            onClick={() => execute({ users: users.map(toRemoveUserInput) })}
          >
            {isRemoving ? "removing..." : "remove"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
