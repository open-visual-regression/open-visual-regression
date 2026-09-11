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

type RevokeAccessTokenButtonProps = {
  tokenId: string;
  tokenName: string;
};

export const RevokeAccessTokenButton = ({ tokenId, tokenName }: RevokeAccessTokenButtonProps) => {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<{ message: string } | null>(null);

  const { execute, status } = useServerAction(serverClient.accessTokens.revoke, {
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
          <Button variant="ghost" color="neutral" size="sm" aria-label={`revoke ${tokenName}`} />
        }
      >
        <Icon icon={XIcon} />
        revoke
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>revoke access token?</AlertDialogTitle>
          <AlertDialogDescription>this cannot be undone.</AlertDialogDescription>
        </AlertDialogHeader>
        <Typography>
          are you sure you want to revoke the access token &quot;{tokenName}&quot;? anything still
          using it will fail.
        </Typography>
        <FieldError errors={[error]} />
        <AlertDialogFooter>
          <AlertDialogCancel>cancel</AlertDialogCancel>
          <AlertDialogAction
            variant="outline"
            color="red"
            disabled={isRevoking}
            onClick={() => execute({ tokenId })}
          >
            {isRevoking ? "revoking..." : "revoke"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
