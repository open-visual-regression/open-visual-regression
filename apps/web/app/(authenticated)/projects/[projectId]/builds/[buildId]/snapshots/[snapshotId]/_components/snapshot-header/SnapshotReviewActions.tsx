"use client";

import { useRouter } from "next/navigation";
import { onError, onSuccess } from "@orpc/client";
import { useServerAction } from "@orpc/react/hooks";
import { CheckIcon, XIcon } from "@ovr/ui/components/icon";
import { toast } from "@ovr/ui/components/toast";
import type { DiffSchema } from "@ovr/api/contracts/diffs";
import { ApproveButton } from "@/lib/components/review-actions/ApproveButton";
import { RejectButton } from "@/lib/components/review-actions/RejectButton";
import { serverClient } from "@/lib/router";

export type SnapshotReviewActionsProps = {
  diffId: string;
  reviewStatus: DiffSchema["reviewStatus"];
};

export const SnapshotReviewActions = ({ diffId, reviewStatus }: SnapshotReviewActionsProps) => {
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

  return (
    <div className="flex flex-row gap-2 shrink-0">
      <RejectButton
        rejected={reviewStatus === "rejected"}
        pending={rejectStatus === "pending"}
        onClick={() => reject({ diffId, vote: "reject" })}
        icon={XIcon}
      />
      <ApproveButton
        approved={reviewStatus === "approved"}
        pending={approveStatus === "pending"}
        onClick={() => approve({ diffId, vote: "approve" })}
        icon={CheckIcon}
      />
    </div>
  );
};
