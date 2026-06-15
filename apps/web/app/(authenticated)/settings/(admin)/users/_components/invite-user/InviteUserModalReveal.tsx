"use client";

import { useState } from "react";
import { Alert, AlertDescription, AlertTitle } from "@ovr/ui/components/alert";
import { Button } from "@ovr/ui/components/button";
import { DialogClose, DialogFooter } from "@ovr/ui/components/dialog";
import { CheckIcon, CopyIcon, Icon } from "@ovr/ui/components/icon";
import { Typography } from "@ovr/ui/components/typography";

type InviteUserModalRevealProps = {
  invitationUrl: string;
};

export const InviteUserModalReveal = ({ invitationUrl }: InviteUserModalRevealProps) => {
  const [copied, setCopied] = useState(false);

  const handleCopyClick = async () => {
    await navigator.clipboard.writeText(invitationUrl);
    setCopied(true);
  };

  return (
    <div className="flex flex-col gap-4">
      <Alert variant="success" className="min-w-0">
        <AlertTitle>share this link with the user so they can accept the invitation.</AlertTitle>
        <AlertDescription className="min-w-0">
          <div className="mt-2 flex min-w-0 items-center gap-2 rounded-md border border-ovr-border-subtle bg-ovr-inset px-3 py-2">
            <Typography as="code" variant="code" className="min-w-0 flex-1 truncate">
              {invitationUrl}
            </Typography>
            <Button type="button" variant="secondary" size="sm" onClick={handleCopyClick}>
              <Icon icon={copied ? CheckIcon : CopyIcon} />
              {copied ? "copied" : "copy"}
            </Button>
          </div>
        </AlertDescription>
      </Alert>
      <DialogFooter>
        <DialogClose render={<Button />}>done</DialogClose>
      </DialogFooter>
    </div>
  );
};
