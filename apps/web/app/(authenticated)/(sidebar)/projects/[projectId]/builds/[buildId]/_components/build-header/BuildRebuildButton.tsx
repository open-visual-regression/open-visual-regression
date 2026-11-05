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

export type BuildRebuildDialogProps = BuildRebuildButtonProps & {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

// Asks to confirm rebuilding. Controlled, so a menu item can open it too.
export const BuildRebuildDialog = ({
  buildId,
  projectId,
  open,
  onOpenChange,
}: BuildRebuildDialogProps) => {
  const router = useRouter();
  const [error, setError] = useState<{ message: string } | null>(null);

  const { execute, status } = useServerAction(serverClient.builds.rebuild, {
    interceptors: [
      onSuccess((result) => {
        onOpenChange(false);
        router.push(`/projects/${projectId}/builds/${result.buildId}`);
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
          <AlertDialogTitle>rebuild?</AlertDialogTitle>
          <AlertDialogDescription>this creates a new build.</AlertDialogDescription>
        </AlertDialogHeader>
        <Typography>this will take new snapshots and diffs of every story.</Typography>
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

export const BuildRebuildButton = ({ buildId, projectId }: BuildRebuildButtonProps) => {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        variant="outline"
        color="neutral"
        className="flex-1 md:flex-none"
        onClick={() => setOpen(true)}
      >
        <Icon icon={RefreshCwIcon} size={10} />
        rebuild
      </Button>
      <BuildRebuildDialog
        buildId={buildId}
        projectId={projectId}
        open={open}
        onOpenChange={setOpen}
      />
    </>
  );
};
