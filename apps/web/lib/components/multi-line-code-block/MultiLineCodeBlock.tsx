"use client";

import { cn } from "@ovr/ui/lib/utils";
import { type ReactNode } from "react";

import { MultiLineCodeBlockContext } from "./MultiLineCodeBlockContext";

type MultiLineCodeBlockProps = {
  lines: string[];
  wrap?: boolean;
  showLineNumbers?: boolean;
  className?: string;
  children: ReactNode;
};

export const MultiLineCodeBlock = ({
  lines,
  wrap = false,
  showLineNumbers = true,
  className,
  children,
}: MultiLineCodeBlockProps) => (
  <MultiLineCodeBlockContext.Provider value={{ lines, wrap, showLineNumbers }}>
    <div
      className={cn(
        "overflow-hidden rounded-md border border-ovr-border-subtle bg-ovr-inset",
        className,
      )}
    >
      {children}
    </div>
  </MultiLineCodeBlockContext.Provider>
);
