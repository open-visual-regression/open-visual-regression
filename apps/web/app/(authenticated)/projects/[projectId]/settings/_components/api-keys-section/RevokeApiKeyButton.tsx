"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { onError, onSuccess } from "@orpc/client";
import { useServerAction } from "@orpc/react/hooks";
import { router as serverClient } from "@/lib/router";
import { Button } from "@ovr/ui/components/button";
import { Icon, XIcon } from "@ovr/ui/components/icon";
import { FieldError } from "@ovr/ui/components/field";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@ovr/ui/components/alert-dialog";

type RevokeApiKeyButtonProps = {
  keyId: string;
  keyName: string;
};

export const RevokeApiKeyButton = ({ keyId, keyName }: RevokeApiKeyButtonProps) => {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<{ message: string } | undefined>();

  const { execute, status } = useServerAction(serverClient.apiKeys.revoke, {
    interceptors: [
      onSuccess(() => {
        setOpen(false);
        router.refresh();
      }),
      onError((err) => setError({ message: err.message })),
    ],
  });

  const handleOpenChange = (nextOpen: boolean) => {
    if (nextOpen) {
      setError(undefined);
    }
    setOpen(nextOpen);
  };

  const isRevoking = status === "pending";

  return (
    <AlertDialog open={open} onOpenChange={handleOpenChange}>
      <AlertDialogTrigger
        render={<Button variant="ghost" size="icon-sm" aria-label={`revoke ${keyName}`} />}
      >
        <Icon icon={XIcon} />
      </AlertDialogTrigger>
      <AlertDialogContent size="sm">
        <AlertDialogHeader>
          <AlertDialogTitle>revoke api key?</AlertDialogTitle>
          <AlertDialogDescription>
            &quot;{keyName}&quot; will stop working immediately. anything using it to authenticate
            will start failing.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <FieldError errors={[error]} />
        <AlertDialogFooter>
          <AlertDialogCancel>cancel</AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            disabled={isRevoking}
            onClick={() => execute({ keyId })}
          >
            {isRevoking ? "revoking..." : "revoke"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
