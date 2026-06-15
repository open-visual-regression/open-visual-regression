"use client";

import { useState } from "react";
import { Button } from "@ovr/ui/components/button";
import { CheckIcon, CopyIcon, Icon } from "@ovr/ui/components/icon";

type CopyInviteButtonProps = {
  invitationUrl: string;
};

export const CopyInviteButton = ({ invitationUrl }: CopyInviteButtonProps) => {
  const [copied, setCopied] = useState(false);

  const handleCopyClick = async () => {
    await navigator.clipboard.writeText(invitationUrl);
    setCopied(true);
  };

  return (
    <Button type="button" variant="secondary" size="sm" onClick={handleCopyClick}>
      <Icon icon={copied ? CheckIcon : CopyIcon} />
      {copied ? "copied" : "copy invite"}
    </Button>
  );
};
