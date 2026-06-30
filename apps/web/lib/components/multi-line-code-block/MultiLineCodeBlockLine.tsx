"use client";

import { Typography } from "@ovr/ui/components/typography";
import { cn } from "@ovr/ui/lib/utils";
import { cva, type VariantProps } from "class-variance-authority";
import { type ReactNode } from "react";

import { useMultiLineCodeBlockContext } from "./MultiLineCodeBlockContext";

const multiLineCodeBlockLineVariants = cva("", {
  variants: {
    tone: {
      default: "text-ovr-fg",
      error: "font-semibold text-ovr-remove",
      muted: "text-ovr-fg-tertiary",
    },
  },
  defaultVariants: {
    tone: "default",
  },
});

type MultiLineCodeBlockLineProps = {
  lineNumber: number;
  children: ReactNode;
  className?: string;
} & VariantProps<typeof multiLineCodeBlockLineVariants>;

export const MultiLineCodeBlockLine = ({
  lineNumber,
  tone,
  children,
  className,
}: MultiLineCodeBlockLineProps) => {
  const { wrap, showLineNumbers } = useMultiLineCodeBlockContext();

  return (
    <div className={cn("flex items-start gap-3 px-3", className)}>
      {showLineNumbers ? (
        <Typography
          as="span"
          variant="code"
          className="w-5 shrink-0 text-right tabular-nums text-ovr-fg-muted select-none"
        >
          {lineNumber}
        </Typography>
      ) : null}
      <Typography
        as="span"
        variant="code"
        className={cn(
          "min-w-0 flex-1",
          wrap ? "whitespace-pre-wrap break-words" : "whitespace-pre",
          multiLineCodeBlockLineVariants({ tone }),
        )}
      >
        {children}
      </Typography>
    </div>
  );
};
