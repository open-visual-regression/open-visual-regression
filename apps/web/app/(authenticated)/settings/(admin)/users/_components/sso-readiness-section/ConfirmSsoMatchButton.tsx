"use client";

import { onError, onSuccess } from "@orpc/client";
import { useServerAction } from "@orpc/react/hooks";
import { useRouter } from "next/navigation";

import { Button } from "@ovr/ui/components/button";
import { toast } from "@ovr/ui/components/toast";

import { serverClient } from "@/lib/router";

type ConfirmSsoMatchButtonProps = {
  identityId: string;
  userId: string;
  name: string;
};

export const ConfirmSsoMatchButton = ({ identityId, userId, name }: ConfirmSsoMatchButtonProps) => {
  const router = useRouter();

  const { execute, status } = useServerAction(serverClient.users.confirmSsoMatch, {
    interceptors: [
      onSuccess(() => router.refresh()),
      onError((err) => {
        toast.error(err.message);
      }),
    ],
  });

  return (
    <Button
      variant="outline"
      color="neutral"
      size="sm"
      disabled={status === "pending"}
      aria-label={`confirm match for ${name}`}
      onClick={() => execute({ identityId, userId })}
    >
      confirm
    </Button>
  );
};
