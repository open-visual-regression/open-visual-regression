"use client";

import { onError, onSuccess } from "@orpc/client";
import { useServerAction } from "@orpc/react/hooks";
import { useRouter } from "next/navigation";

import { CheckIcon } from "@ovr/ui/components/icon";
import { toast } from "@ovr/ui/components/toast";

import { ResponsiveActionButton } from "@/lib/components/responsive-action-button/ResponsiveActionButton";
import { useReviewRefresh } from "@/lib/orpc/useReviewRefresh";
import { serverClient } from "@/lib/router";

export type SnapshotApproveButtonProps = {
  diffId: string;
  approved: boolean;
  nextHref: string | null;
};

export const SnapshotApproveButton = ({
  diffId,
  approved,
  nextHref,
}: SnapshotApproveButtonProps) => {
  const router = useRouter();
  const refreshReview = useReviewRefresh();

  const { execute, status } = useServerAction(serverClient.diffs.castVote, {
    interceptors: [
      onSuccess(() => refreshReview()),
      onError((err) => {
        toast.error(err.message);
      }),
    ],
  });

  const pending = status === "pending";

  const handleClick = () => {
    execute({ diffId, vote: "approve" });
    if (nextHref) {
      router.push(nextHref);
    }
  };

  return (
    <ResponsiveActionButton
      icon={CheckIcon}
      color="green"
      disabled={pending || approved}
      className={
        approved
          ? "disabled:bg-ovr-diff-add disabled:text-ovr-on-accent disabled:border-transparent"
          : undefined
      }
      onClick={handleClick}
    >
      {approved ? "approved" : pending ? "approving..." : "approve"}
    </ResponsiveActionButton>
  );
};
