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
import { CircleSlash2Icon, Icon } from "@ovr/ui/components/icon";
import { Typography } from "@ovr/ui/components/typography";

import { serverClient } from "@/lib/router";

export type BuildCancelButtonProps = {
  buildId: string;
};

export const BuildCancelButton = ({ buildId }: BuildCancelButtonProps) => {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<{ message: string } | null>(null);

  const { execute, status } = useServerAction(serverClient.builds.cancel, {
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

  const pending = status === "pending";

  return (
    <AlertDialog open={open} onOpenChange={handleOpenChange}>
      <AlertDialogTrigger
        render={<Button variant="outline" color="neutral" className="flex-1 md:flex-none" />}
      >
        <Icon icon={CircleSlash2Icon} className="hidden md:inline lg:hidden" />
        <span className="md:sr-only lg:not-sr-only">cancel build</span>
      </AlertDialogTrigger>
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
