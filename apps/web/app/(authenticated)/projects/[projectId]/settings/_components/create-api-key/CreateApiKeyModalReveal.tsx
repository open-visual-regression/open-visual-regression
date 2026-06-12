"use client";

import { useState } from "react";
import { Alert, AlertDescription, AlertTitle } from "@ovr/ui/components/alert";
import { Button } from "@ovr/ui/components/button";
import { DialogClose, DialogFooter } from "@ovr/ui/components/dialog";
import { CheckIcon, CopyIcon, Icon } from "@ovr/ui/components/icon";
import { Typography } from "@ovr/ui/components/typography";

type CreateApiKeyModalRevealProps = {
  apiKey: string;
};

export const CreateApiKeyModalReveal = ({ apiKey }: CreateApiKeyModalRevealProps) => {
  const [copied, setCopied] = useState(false);

  const handleCopyClick = async () => {
    await navigator.clipboard.writeText(apiKey);
    setCopied(true);
  };

  return (
    <div className="flex flex-col gap-4">
      <Alert>
        <AlertTitle>copy this key now, it will only be shown once</AlertTitle>
        <AlertDescription>
          <div className="flex items-center gap-2 rounded-md border border-ovr-border-subtle bg-ovr-inset px-3 py-2">
            <Typography as="code" variant="code" className="flex-1 break-all">
              {apiKey}
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
