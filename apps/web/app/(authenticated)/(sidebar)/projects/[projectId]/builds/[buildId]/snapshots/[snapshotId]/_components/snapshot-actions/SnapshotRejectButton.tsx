"use client";

import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";

import { XIcon } from "@ovr/ui/components/icon";
import { toast } from "@ovr/ui/components/toast";

import { ResponsiveActionButton } from "@/lib/components/responsive-action-button/ResponsiveActionButton";
import { orpc } from "@/lib/orpc/client";
import { useReviewRefresh } from "@/lib/orpc/useReviewRefresh";

export type SnapshotRejectButtonProps = {
  diffId: string;
  rejected: boolean;
  nextHref: string | null;
};

export const SnapshotRejectButton = ({ diffId, rejected, nextHref }: SnapshotRejectButtonProps) => {
  const router = useRouter();
  const refreshReview = useReviewRefresh();

  const { mutate, isPending: pending } = useMutation(
    orpc.diffs.castVote.mutationOptions({
      onSuccess: () => refreshReview(),
      onError: (err) => {
        toast.error(err.message);
      },
    }),
  );

  const handleClick = () => {
    mutate({ diffId, vote: "reject" });
    if (nextHref) {
      router.push(nextHref);
    }
  };

  return (
    <ResponsiveActionButton
      icon={XIcon}
      disabled={pending || rejected}
      className={
        rejected
          ? "disabled:bg-ovr-red disabled:text-ovr-on-solid disabled:border-transparent"
          : undefined
      }
      onClick={handleClick}
    >
      {rejected ? "rejected" : pending ? "rejecting..." : "reject"}
    </ResponsiveActionButton>
  );
};
