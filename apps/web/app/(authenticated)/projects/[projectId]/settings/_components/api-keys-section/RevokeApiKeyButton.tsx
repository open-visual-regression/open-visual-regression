"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { onError, onSuccess } from "@orpc/client";
import { useServerAction } from "@orpc/react/hooks";
import { serverClient } from "@/lib/router";
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
import { Typography } from "@ovr/ui/components/typography";

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
        render={<Button variant="ghost" size="sm" aria-label={`revoke ${keyName}`} />}
      >
        <Icon icon={XIcon} />
        revoke
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>revoke api key?</AlertDialogTitle>
          <AlertDialogDescription>this cannot be undone.</AlertDialogDescription>
        </AlertDialogHeader>
        <Typography>
          are you sure you want to revoke the api key &quot;{keyName}&quot;? anything still using it
          will fail.
        </Typography>
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
