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
import { Icon, LockIcon } from "@ovr/ui/components/icon";
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
        toast.success("ci checks disabled");
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
        <Icon icon={LockIcon} className="md:max-xl:hidden" />
        disable
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>disable git integration?</AlertDialogTitle>
          <AlertDialogDescription>you can turn them back on at any time.</AlertDialogDescription>
        </AlertDialogHeader>
        <Typography>
          builds will stop updating the ci check on your commits. commit and branch links will keep
          working.
        </Typography>
        <FieldError errors={[error]} />
        <AlertDialogFooter>
          <AlertDialogCancel>cancel</AlertDialogCancel>
          <AlertDialogAction
            type="button"
            variant="outline"
            color="red"
            disabled={isDisabling}
            onClick={() => execute({ projectId, enabled: false })}
          >
            {isDisabling ? "disabling..." : "disable"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
