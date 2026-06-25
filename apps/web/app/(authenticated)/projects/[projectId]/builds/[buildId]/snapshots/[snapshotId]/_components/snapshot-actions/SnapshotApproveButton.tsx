"use client";

import { useRouter } from "next/navigation";
import { onError, onSuccess } from "@orpc/client";
import { useServerAction } from "@orpc/react/hooks";
import { Button } from "@ovr/ui/components/button";
import { Icon, CheckIcon } from "@ovr/ui/components/icon";
import { toast } from "@ovr/ui/components/toast";
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
      disabled={pending || approved}
      className={
        approved
          ? "disabled:bg-ovr-diff-add disabled:text-ovr-on-accent disabled:border-transparent"
          : undefined
      }
      onClick={() => execute({ diffId, vote: "approve" })}
      size="sm"
    >
      <Icon icon={CheckIcon} />
      {approved ? "approved" : pending ? "approving..." : "approve"}
    </Button>
  );
};
