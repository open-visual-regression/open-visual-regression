"use client";

import { useRouter } from "next/navigation";
import { onError, onSuccess } from "@orpc/client";
import { useServerAction } from "@orpc/react/hooks";
import { Button } from "@ovr/ui/components/button";
import { Icon, CheckIcon, XIcon } from "@ovr/ui/components/icon";
import { toast } from "@ovr/ui/components/toast";
import { serverClient } from "@/lib/router";

export type SnapshotReviewActionsProps = {
  diffId: string;
};

export const SnapshotReviewActions = ({ diffId }: SnapshotReviewActionsProps) => {
  const router = useRouter();

  const { execute: approve, status: approveStatus } = useServerAction(serverClient.diffs.castVote, {
    interceptors: [
      onSuccess(() => router.refresh()),
      onError((err) => {
        toast.error(err.message);
      }),
    ],
  });

  const { execute: reject, status: rejectStatus } = useServerAction(serverClient.diffs.castVote, {
    interceptors: [
      onSuccess(() => router.refresh()),
      onError((err) => {
        toast.error(err.message);
      }),
    ],
  });

  const isApproving = approveStatus === "pending";
  const isRejecting = rejectStatus === "pending";

  return (
    <div className="flex flex-row gap-2 shrink-0">
      <Button
        variant="secondary"
        disabled={isRejecting}
        onClick={() => reject({ diffId, vote: "reject" })}
      >
        <Icon icon={XIcon} />
        {isRejecting ? "rejecting..." : "reject"}
      </Button>
      <Button disabled={isApproving} onClick={() => approve({ diffId, vote: "approve" })}>
        <Icon icon={CheckIcon} />
        {isApproving ? "approving..." : "approve"}
      </Button>
    </div>
  );
};
