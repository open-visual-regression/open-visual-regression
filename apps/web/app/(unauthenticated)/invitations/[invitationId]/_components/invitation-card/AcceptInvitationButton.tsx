"use client";

import { onError, onSuccess } from "@orpc/client";
import { useServerAction } from "@orpc/react/hooks";
import { useState } from "react";

import { Button } from "@ovr/ui/components/button";
import { FieldError, FieldGroup } from "@ovr/ui/components/field";

import { serverClient } from "@/lib/router";

type AcceptInvitationButtonProps = {
  invitationId: string;
};

export const AcceptInvitationButton = ({ invitationId }: AcceptInvitationButtonProps) => {
  const [error, setError] = useState<{ message: string } | null>(null);

  const { execute, status } = useServerAction(serverClient.invitations.acceptInvitation, {
    interceptors: [
      onSuccess(() => {
        window.location.href = "/";
      }),
      onError((err) => setError({ message: err.message })),
    ],
  });

  const isPending = status === "pending";

  return (
    <FieldGroup>
      <FieldError errors={[error]} />
      <Button
        size="lg"
        className="w-full"
        disabled={isPending}
        onClick={() => execute({ invitationId })}
      >
        {isPending ? "joining…" : "accept invitation"}
      </Button>
    </FieldGroup>
  );
};
