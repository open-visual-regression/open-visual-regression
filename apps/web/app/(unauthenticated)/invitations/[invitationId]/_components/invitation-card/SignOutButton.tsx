"use client";

import { useState } from "react";

import { Button } from "@ovr/ui/components/button";

import { authClient } from "@/lib/auth/client";

export const SignOutButton = () => {
  const [isPending, setIsPending] = useState(false);

  const handleSignOut = async () => {
    setIsPending(true);
    await authClient.signOut();
    window.location.reload();
  };

  return (
    <Button
      size="lg"
      variant="outline"
      className="w-full"
      disabled={isPending}
      onClick={handleSignOut}
    >
      {isPending ? "signing out…" : "sign out"}
    </Button>
  );
};
