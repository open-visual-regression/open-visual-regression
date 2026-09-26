"use client";

import { onError, onSuccess } from "@orpc/client";
import { useServerAction } from "@orpc/react/hooks";

import { Button } from "@ovr/ui/components/button";
import { Icon, XIcon } from "@ovr/ui/components/icon";
import { toast } from "@ovr/ui/components/toast";

import { useReviewRefresh } from "@/lib/orpc/useReviewRefresh";
import { serverClient } from "@/lib/router";

export type RemoveReviewButtonProps = {
  diffId: string;
  reviewerId: string;
  label: string;
};

export const RemoveReviewButton = ({ diffId, reviewerId, label }: RemoveReviewButtonProps) => {
  const refreshReview = useReviewRefresh();

  const { execute, status } = useServerAction(serverClient.diffs.removeVote, {
    interceptors: [
      onSuccess(() => refreshReview()),
      onError((err) => {
        toast.error(err.message);
      }),
    ],
  });

  return (
    <Button
      variant="ghost"
      color="neutral"
      size="icon-sm"
      disabled={status === "pending"}
      onClick={() => execute({ diffId, reviewerId })}
      aria-label={label}
    >
      <Icon icon={XIcon} />
    </Button>
  );
};
