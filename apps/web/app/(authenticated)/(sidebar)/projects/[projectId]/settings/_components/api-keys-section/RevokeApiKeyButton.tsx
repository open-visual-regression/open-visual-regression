"use client";

import { onError, onSuccess } from "@orpc/client";
import { useServerAction } from "@orpc/react/hooks";
import { useRouter } from "next/navigation";
import { useState } from "react";

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
import { Button } from "@ovr/ui/components/button";
import { FieldError } from "@ovr/ui/components/field";
import { Icon, XIcon } from "@ovr/ui/components/icon";
import { Typography } from "@ovr/ui/components/typography";

import { serverClient } from "@/lib/router";

type RevokeApiKeyButtonProps = {
  keyId: string;
  keyName: string;
};

export const RevokeApiKeyButton = ({ keyId, keyName }: RevokeApiKeyButtonProps) => {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<{ message: string } | null>(null);

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
      setError(null);
    }
    setOpen(nextOpen);
  };

  const isRevoking = status === "pending";

  return (
    <AlertDialog open={open} onOpenChange={handleOpenChange}>
      <AlertDialogTrigger
        className="inline-flex flex-row items-center"
        render={
          <Button variant="ghost" color="neutral" size="sm" aria-label={`Revoke ${keyName}`} />
        }
      >
        <Icon icon={XIcon} />
        Revoke
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Revoke API key?</AlertDialogTitle>
          <AlertDialogDescription>This cannot be undone.</AlertDialogDescription>
        </AlertDialogHeader>
        <Typography>
          Are you sure you want to revoke the API key &quot;{keyName}&quot;? anything still using it
          will fail.
        </Typography>
        <FieldError errors={[error]} />
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            variant="outline"
            color="red"
            disabled={isRevoking}
            onClick={() => execute({ keyId })}
          >
            {isRevoking ? "Revoking..." : "Revoke"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
