"use client";

import { onError, onSuccess } from "@orpc/client";
import { useServerAction } from "@orpc/react/hooks";
import { useRouter } from "next/navigation";

import { Button } from "@ovr/ui/components/button";
import { Icon, CheckIcon } from "@ovr/ui/components/icon";
import { toast } from "@ovr/ui/components/toast";
import { cn } from "@ovr/ui/lib/utils";

import { serverClient } from "@/lib/router";

export type SnapshotApproveButtonProps = {
  diffId: string;
  approved: boolean;
};

export const SnapshotApproveButton = ({ diffId, approved }: SnapshotApproveButtonProps) => {
  const router = useRouter();

  const { execute, status } = useServerAction(serverClient.diffs.castVote, {
    interceptors: [
      onSuccess(() => router.refresh()),
      onError((err) => {
        toast.error(err.message);
      }),
    ],
  });

  const pending = status === "pending";

  return (
    <Button
      variant="outline"
      color="green"
      disabled={pending || approved}
      className={cn(
        "w-7 gap-0 px-0 lg:w-auto lg:gap-1 lg:px-2.5",
        approved &&
          "disabled:bg-ovr-diff-add disabled:text-ovr-on-accent disabled:border-transparent",
      )}
      onClick={() => execute({ diffId, vote: "approve" })}
      size="sm"
    >
      <Icon icon={CheckIcon} />
      <span className="sr-only lg:not-sr-only">
        {approved ? "approved" : pending ? "approving..." : "approve"}
      </span>
    </Button>
  );
};
