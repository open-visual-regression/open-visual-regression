"use client";

import { useEffect, useState } from "react";
import type { VariantProps } from "class-variance-authority";
import { Button, buttonVariants } from "@ovr/ui/components/button";
import { CheckIcon, CopyIcon, Icon } from "@ovr/ui/components/icon";

const COPIED_RESET_DELAY_MS = 2000;

type CopyButtonProps = {
  text: string;
  label?: string;
  className?: string;
} & Pick<VariantProps<typeof buttonVariants>, "variant" | "size">;

export const CopyButton = ({
  text,
  label = "copy",
  variant = "secondary",
  size = "sm",
  className,
}: CopyButtonProps) => {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) {
      return;
    }

    const timeout = setTimeout(() => setCopied(false), COPIED_RESET_DELAY_MS);
    return () => clearTimeout(timeout);
  }, [copied]);

  const handleCopyClick = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
  };

  return (
    <Button
      type="button"
      variant={variant}
      size={size}
      className={className}
      onClick={handleCopyClick}
    >
      <Icon icon={copied ? CheckIcon : CopyIcon} />
      {copied ? "copied" : label}
    </Button>
  );
};
