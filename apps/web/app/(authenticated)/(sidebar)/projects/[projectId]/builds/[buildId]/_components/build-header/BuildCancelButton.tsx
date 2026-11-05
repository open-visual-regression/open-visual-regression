"use client";

import { onError, onSuccess } from "@orpc/client";
import { useServerAction } from "@orpc/react/hooks";
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
} from "@ovr/ui/components/alert-dialog";
import { Button } from "@ovr/ui/components/button";
import { FieldError } from "@ovr/ui/components/field";
import { Typography } from "@ovr/ui/components/typography";

import { useReviewRefresh } from "@/lib/orpc/useReviewRefresh";
import { serverClient } from "@/lib/router";

export type BuildCancelButtonProps = {
  buildId: string;
};

export type BuildCancelDialogProps = BuildCancelButtonProps & {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

// Asks to confirm canceling the build. Controlled, so a menu item can open it too.
export const BuildCancelDialog = ({ buildId, open, onOpenChange }: BuildCancelDialogProps) => {
  const refreshReview = useReviewRefresh();
  const [error, setError] = useState<{ message: string } | null>(null);

  const { execute, status } = useServerAction(serverClient.builds.cancel, {
    interceptors: [
      onSuccess(() => {
        onOpenChange(false);
        refreshReview();
      }),
      onError((err) => setError({ message: err.message })),
    ],
  });

  const handleOpenChange = (nextOpen: boolean) => {
    if (nextOpen) {
      setError(null);
    }
    onOpenChange(nextOpen);
  };

  const pending = status === "pending";

  return (
    <AlertDialog open={open} onOpenChange={handleOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>cancel build?</AlertDialogTitle>
          <AlertDialogDescription>this cannot be undone.</AlertDialogDescription>
        </AlertDialogHeader>
        <Typography>
          are you sure you want to cancel this build? any queued or in-progress snapshots and diffs
          will be canceled. anything already completed stays as-is.
        </Typography>
        <FieldError errors={[error]} />
        <AlertDialogFooter>
          <AlertDialogCancel>keep building</AlertDialogCancel>
          <AlertDialogAction
            variant="outline"
            color="neutral"
            disabled={pending}
            onClick={() => execute({ buildId })}
          >
            {pending ? "canceling..." : "cancel build"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export const BuildCancelButton = ({ buildId }: BuildCancelButtonProps) => {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        variant="outline"
        color="neutral"
        className="flex-1 md:flex-none"
        onClick={() => setOpen(true)}
      >
        cancel build
      </Button>
      <BuildCancelDialog buildId={buildId} open={open} onOpenChange={setOpen} />
    </>
  );
};
