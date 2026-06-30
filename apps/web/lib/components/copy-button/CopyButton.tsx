"use client";

import { Button, buttonVariants } from "@ovr/ui/components/button";
import { CheckIcon, CopyIcon, Icon } from "@ovr/ui/components/icon";
import type { VariantProps } from "class-variance-authority";
import { useEffect, useState, type ReactNode } from "react";

const COPIED_RESET_DELAY_MS = 2000;

type CopyButtonProps = {
  text: string;
  children?: ReactNode;
  copiedLabel?: ReactNode;
  className?: string;
} & Pick<VariantProps<typeof buttonVariants>, "variant" | "color" | "size">;

export const CopyButton = ({
  text,
  children = "copy",
  copiedLabel = "copied",
  variant = "outline",
  color = "neutral",
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
      color={color}
      size={size}
      className={className}
      onClick={handleCopyClick}
    >
      <Icon icon={copied ? CheckIcon : CopyIcon} />
      {copied ? copiedLabel : children}
    </Button>
  );
};
