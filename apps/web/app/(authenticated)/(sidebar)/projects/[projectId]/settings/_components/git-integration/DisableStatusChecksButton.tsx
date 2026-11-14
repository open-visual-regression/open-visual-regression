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
import { toast } from "@ovr/ui/components/toast";
import { Typography } from "@ovr/ui/components/typography";

import { serverClient } from "@/lib/router";

type DisableStatusChecksButtonProps = {
  projectId: string;
  className?: string;
};

export const DisableStatusChecksButton = ({
  projectId,
  className,
}: DisableStatusChecksButtonProps) => {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<{ message: string } | null>(null);

  const { execute, status } = useServerAction(serverClient.gitIntegrations.setStatusChecks, {
    interceptors: [
      onSuccess(() => {
        setOpen(false);
        toast.success("CI checks disabled");
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

  const isDisabling = status === "pending";

  return (
    <AlertDialog open={open} onOpenChange={handleOpenChange}>
      <AlertDialogTrigger
        render={<Button type="button" variant="outline" color="red" className={className} />}
      >
        Disable
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Disable Git integration?</AlertDialogTitle>
          <AlertDialogDescription>You can turn them back on at any time.</AlertDialogDescription>
        </AlertDialogHeader>
        <Typography>
          Builds will stop updating the CI check on your commits. Commit and branch links will keep
          working.
        </Typography>
        <FieldError errors={[error]} />
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            type="button"
            variant="outline"
            color="red"
            disabled={isDisabling}
            onClick={() => execute({ projectId, enabled: false })}
          >
            {isDisabling ? "Disabling..." : "Disable"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
