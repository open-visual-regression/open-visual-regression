"use client";

import { onError, onSuccess } from "@orpc/client";
import { useServerAction } from "@orpc/react/hooks";
import { useRouter } from "next/navigation";

import { Button } from "@ovr/ui/components/button";
import { Icon, Trash2Icon } from "@ovr/ui/components/icon";
import { toast } from "@ovr/ui/components/toast";

import { serverClient } from "@/lib/router";

export type RemoveReviewButtonProps = {
  diffId: string;
  reviewerId: string;
  isOwnReview: boolean;
};

export const RemoveReviewButton = ({
  diffId,
  reviewerId,
  isOwnReview,
}: RemoveReviewButtonProps) => {
  const router = useRouter();

  const { execute, status } = useServerAction(serverClient.diffs.removeVote, {
    interceptors: [
      onSuccess(() => router.refresh()),
      onError((err) => {
        toast.error(err.message);
      }),
    ],
  });

  return (
    <Button
      variant="ghost"
      color="red"
      size="icon-sm"
      disabled={status === "pending"}
      onClick={() => execute({ diffId, reviewerId })}
      aria-label={isOwnReview ? "remove your review" : "remove review"}
    >
      <Icon icon={Trash2Icon} />
    </Button>
  );
};
