"use client";

import { Typography } from "@ovr/ui/components/typography";
import { cn } from "@ovr/ui/lib/utils";
import { useMultiLineCodeBlockContext } from "./MultiLineCodeBlockContext";

type MultiLineCodeBlockLineCountProps = {
  className?: string;
};

export const MultiLineCodeBlockLineCount = ({ className }: MultiLineCodeBlockLineCountProps) => {
  const { lines } = useMultiLineCodeBlockContext();

  return (
    <Typography
      as="span"
      variant="body-sm"
      className={cn("ml-auto shrink-0 text-ovr-fg-muted", className)}
    >
      {lines.length} {lines.length === 1 ? "line" : "lines"}
    </Typography>
  );
};
