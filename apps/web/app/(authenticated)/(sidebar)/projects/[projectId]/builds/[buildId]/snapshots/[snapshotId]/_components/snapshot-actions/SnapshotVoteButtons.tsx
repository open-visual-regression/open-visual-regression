"use client";

import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import type { DiffReviewVoteSchema as DiffReviewVote } from "@ovr/api/contracts/diffs";
import type { SnapshotSchema } from "@ovr/api/contracts/snapshots";
import { CheckIcon, XIcon } from "@ovr/ui/components/icon";
import { toast } from "@ovr/ui/components/toast";

import { ResponsiveActionButton } from "@/lib/components/responsive-action-button/ResponsiveActionButton";
import { orpc } from "@/lib/orpc/client";
import { useReviewRefresh } from "@/lib/orpc/useReviewRefresh";

export type SnapshotVoteButtonsProps = {
  diffId: string;
  status: SnapshotSchema["status"];
  nextHref: string | null;
};

const votedStatus: Record<DiffReviewVote, SnapshotSchema["status"]> = {
  approve: "approved",
  reject: "rejected",
};

export const SnapshotVoteButtons = ({ diffId, status, nextHref }: SnapshotVoteButtonsProps) => {
  const router = useRouter();
  const refreshReview = useReviewRefresh();
  const [isRefreshing, startTransition] = useTransition();
  // The vote just cast, shown straight away instead of the stale status until the refreshed one
  // arrives. It is cleared in the same transition as the refresh, so the two swap in one commit.
  const [castingVote, setCastingVote] = useState<DiffReviewVote | null>(null);

  const { mutate, isPending } = useMutation(
    orpc.diffs.castVote.mutationOptions({
      onSuccess: () => {
        startTransition(() => {
          setCastingVote(null);
          refreshReview();
        });
      },
      onError: (err) => {
        setCastingVote(null);
        toast.error(err.message);
      },
    }),
  );

  const castVote = (vote: DiffReviewVote) => {
    setCastingVote(vote);
    mutate({ diffId, vote });
    if (nextHref) {
      router.push(nextHref);
    }
  };

  const shownStatus = castingVote ? votedStatus[castingVote] : status;
  const busy = isPending || isRefreshing;

  const approved = shownStatus === "approved";
  const rejected = shownStatus === "rejected";

  return (
    <>
      <ResponsiveActionButton
        icon={XIcon}
        disabled={busy || rejected}
        className={
          rejected
            ? "disabled:bg-ovr-red disabled:text-ovr-on-solid disabled:border-transparent"
            : undefined
        }
        onClick={() => castVote("reject")}
      >
        {rejected ? "rejected" : "reject"}
      </ResponsiveActionButton>
      <ResponsiveActionButton
        icon={CheckIcon}
        color="green"
        disabled={busy || approved}
        className={
          approved
            ? "disabled:bg-ovr-diff-add disabled:text-ovr-on-accent disabled:border-transparent"
            : undefined
        }
        onClick={() => castVote("approve")}
      >
        {approved ? "approved" : "approve"}
      </ResponsiveActionButton>
    </>
  );
};
