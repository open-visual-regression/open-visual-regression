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
  AlertDialogTrigger,
} from "@ovr/ui/components/alert-dialog";
import { FieldError } from "@ovr/ui/components/field";
import { RefreshCwIcon } from "@ovr/ui/components/icon";
import { Typography } from "@ovr/ui/components/typography";

import { ResponsiveActionButton } from "@/lib/components/responsive-action-button/ResponsiveActionButton";
import { useReviewRefresh } from "@/lib/orpc/useReviewRefresh";
import { serverClient } from "@/lib/router";

export type SnapshotRebuildButtonProps = {
  buildId: string;
  snapshotId: string;
};

export const SnapshotRebuildButton = ({ buildId, snapshotId }: SnapshotRebuildButtonProps) => {
  const refreshReview = useReviewRefresh();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<{ message: string } | null>(null);

  const { execute, status } = useServerAction(serverClient.snapshots.rebuild, {
    interceptors: [
      onSuccess(() => {
        setOpen(false);
        refreshReview();
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

  const pending = status === "pending";

  return (
    <AlertDialog open={open} onOpenChange={handleOpenChange}>
      <AlertDialogTrigger render={<ResponsiveActionButton icon={RefreshCwIcon} />}>
        rebuild
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>rebuild this snapshot?</AlertDialogTitle>
          <AlertDialogDescription>this captures the story again.</AlertDialogDescription>
        </AlertDialogHeader>
        <Typography>
          this replaces the current screenshot, logs and diff with a new capture, and discards any
          review on it. the rest of the build is left alone.
        </Typography>
        <FieldError errors={[error]} />
        <AlertDialogFooter>
          <AlertDialogCancel>keep as-is</AlertDialogCancel>
          <AlertDialogAction
            variant="outline"
            color="neutral"
            disabled={pending}
            onClick={() => execute({ buildId, snapshotIds: [snapshotId] })}
          >
            {pending ? "rebuilding..." : "rebuild"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
