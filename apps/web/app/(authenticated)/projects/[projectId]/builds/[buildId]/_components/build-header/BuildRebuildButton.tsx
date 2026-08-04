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
import { Icon, RefreshCwIcon } from "@ovr/ui/components/icon";
import { Typography } from "@ovr/ui/components/typography";

import { serverClient } from "@/lib/router";

export type BuildRebuildButtonProps = {
  buildId: string;
  projectId: string;
};

export const BuildRebuildButton = ({ buildId, projectId }: BuildRebuildButtonProps) => {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<{ message: string } | null>(null);

  const { execute, status } = useServerAction(serverClient.builds.rebuild, {
    interceptors: [
      onSuccess((result) => {
        setOpen(false);
        router.push(`/projects/${projectId}/builds/${result.buildId}`);
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
        <Icon icon={RefreshCwIcon} size={10} />
        rebuild
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>rebuild?</AlertDialogTitle>
          <AlertDialogDescription>this creates a new run.</AlertDialogDescription>
        </AlertDialogHeader>
        <Typography>
          this will take new snapshots and diffs of every story in this build. the current run is
          left as-is.
        </Typography>
        <FieldError errors={[error]} />
        <AlertDialogFooter>
          <AlertDialogCancel>keep as-is</AlertDialogCancel>
          <AlertDialogAction
            variant="outline"
            color="neutral"
            disabled={pending}
            onClick={() => execute({ buildId })}
          >
            {pending ? "rebuilding..." : "rebuild"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
